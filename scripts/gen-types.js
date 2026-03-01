const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

function parseEnv(content) {
  const env = {};
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  });
  return env;
}

let dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
let projectId = process.env.SUPABASE_PROJECT_ID;
let accessToken = process.env.SUPABASE_ACCESS_TOKEN;
if (fs.existsSync(envPath)) {
  const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  dbUrl = dbUrl || env.SUPABASE_DB_URL || env.DATABASE_URL;
  projectId = projectId || env.SUPABASE_PROJECT_ID;
  accessToken = accessToken || env.SUPABASE_ACCESS_TOKEN;
}

const outPath = path.join(root, 'supabase', 'types.ts');
let cmd;

if (dbUrl) {
  // Dùng connection string → không cần supabase login
  cmd = `npx supabase gen types typescript --db-url "${dbUrl.replace(/"/g, '\\"')}"`;
} else if (projectId) {
  // Dùng project-id; Supabase CLI đọc SUPABASE_ACCESS_TOKEN từ env nếu có
  cmd = `npx supabase gen types typescript --project-id ${projectId}`;
} else {
  console.error('Thiếu cấu hình. Thêm vào .env một trong hai:');
  console.error('  SUPABASE_DB_URL=postgresql://...  (Supabase → Settings → Database → Connection string)');
  console.error('  SUPABASE_PROJECT_ID=xxx  và  SUPABASE_ACCESS_TOKEN=xxx  (token từ supabase.com/account/tokens)');
  process.exit(1);
}

const execEnv = { ...process.env };
if (accessToken) execEnv.SUPABASE_ACCESS_TOKEN = accessToken;

try {
  const stdout = execSync(cmd, { encoding: 'utf8', cwd: root, env: execEnv });
  fs.writeFileSync(outPath, stdout);
  console.log('Written', outPath);
} catch (err) {
  if (err.stderr && /Access token not provided/.test(String(err.stderr))) {
    console.error('Supabase CLI cần đăng nhập khi dùng --project-id.');
    console.error('Chọn 1 trong 2:');
    console.error('  1) Chạy: npx supabase login');
    console.error('  2) Thêm SUPABASE_DB_URL vào .env (Supabase → Settings → Database → Connection string URI)');
  }
  throw err;
}
