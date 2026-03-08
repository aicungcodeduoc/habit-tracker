/**
 * Buddy Actions — Function declarations & executor for Gemini Function Calling.
 * Allows AI Buddy to perform actions in the app (create/delete habits, toggle completions, etc.)
 */

import { getHabits, createHabit, deleteHabit } from './habitService';
import { toggleCompletion, getCompletionsForDate } from './completionService';

// --- Gemini Function Declarations (JSON Schema) ---

export const BUDDY_FUNCTION_DECLARATIONS = [
  {
    name: 'get_habits',
    description: 'Lấy danh sách tất cả thói quen hiện tại của người dùng, bao gồm tên, tần suất, streak, và trạng thái hoàn thành hôm nay',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'create_habit',
    description: 'Tạo một thói quen mới cho người dùng',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: {
          type: 'STRING',
          description: 'Tên thói quen (ví dụ: "Đọc sách", "Tập thể dục", "Thiền")',
        },
        frequency: {
          type: 'STRING',
          description: 'Tần suất thực hiện: "daily" (hàng ngày) hoặc "weekly" (hàng tuần). Mặc định là "daily"',
          enum: ['daily', 'weekly'],
        },
        environment: {
          type: 'STRING',
          description: 'Nơi thực hiện thói quen',
          enum: ['home', 'work', 'outdoors', 'gym', 'cafe', 'anywhere'],
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_habit',
    description: 'Xoá một thói quen của người dùng. CHỈ gọi function này sau khi người dùng đã xác nhận đồng ý xoá.',
    parameters: {
      type: 'OBJECT',
      properties: {
        habit_name: {
          type: 'STRING',
          description: 'Tên thói quen cần xoá (tìm theo tên gần đúng)',
        },
      },
      required: ['habit_name'],
    },
  },
  {
    name: 'toggle_completion',
    description: 'Đánh dấu hoàn thành hoặc bỏ đánh dấu hoàn thành một thói quen cho một ngày cụ thể',
    parameters: {
      type: 'OBJECT',
      properties: {
        habit_name: {
          type: 'STRING',
          description: 'Tên thói quen cần đánh dấu',
        },
        date: {
          type: 'STRING',
          description: 'Ngày cần đánh dấu, định dạng YYYY-MM-DD. Nếu không có thì mặc định là hôm nay.',
        },
      },
      required: ['habit_name'],
    },
  },
  {
    name: 'get_today_progress',
    description: 'Xem tiến độ hoàn thành thói quen của ngày hôm nay, bao gồm số lượng đã hoàn thành và chưa hoàn thành',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
];

// --- Helpers ---

/**
 * Find a habit by name (case-insensitive, partial match).
 * Returns the best match or null.
 */
const findHabitByName = (habits, searchName) => {
  if (!habits || !searchName) return null;
  const search = searchName.toLowerCase().trim();

  // Exact match first
  const exact = habits.find(h => h.title.toLowerCase() === search);
  if (exact) return exact;

  // Partial match (search is contained in title or vice versa)
  const partial = habits.find(
    h => h.title.toLowerCase().includes(search) || search.includes(h.title.toLowerCase())
  );
  return partial || null;
};

const formatLocalDate = (date) => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Action Executor ---

/**
 * Execute a Buddy action by function name and args.
 * Returns { success, message, data? } for Gemini to summarize.
 */
export const executeBuddyAction = async (functionName, args = {}) => {
  try {
    switch (functionName) {
      case 'get_habits':
        return await executeGetHabits();
      case 'create_habit':
        return await executeCreateHabit(args);
      case 'delete_habit':
        return await executeDeleteHabit(args);
      case 'toggle_completion':
        return await executeToggleCompletion(args);
      case 'get_today_progress':
        return await executeGetTodayProgress();
      default:
        return { success: false, message: `Không hỗ trợ action: ${functionName}` };
    }
  } catch (error) {
    console.error(`Error executing buddy action ${functionName}:`, error);
    return { success: false, message: error.message || 'Đã xảy ra lỗi khi thực hiện hành động' };
  }
};

// --- Individual Action Implementations ---

const executeGetHabits = async () => {
  const { data, error } = await getHabits();
  if (error) throw error;

  if (!data || data.length === 0) {
    return { success: true, message: 'Người dùng chưa có thói quen nào.' };
  }

  const habitList = data.map(h => ({
    name: h.title,
    frequency: h.frequency,
    streak: h.streak || 0,
    longest_streak: h.longest_streak || 0,
    environment: h.environment,
  }));

  return {
    success: true,
    message: `Người dùng có ${data.length} thói quen.`,
    data: habitList,
  };
};

const executeCreateHabit = async (args) => {
  const { name, frequency = 'daily', environment = 'anywhere' } = args;
  if (!name) return { success: false, message: 'Thiếu tên thói quen.' };

  const { data, error } = await createHabit({
    habitName: name,
    frequency,
    environment,
  });

  if (error) throw error;

  return {
    success: true,
    message: `Đã tạo thói quen "${data.title}" thành công (${frequency === 'daily' ? 'hàng ngày' : 'hàng tuần'}).`,
    data: { id: data.id, title: data.title, frequency: data.frequency },
  };
};

const executeDeleteHabit = async (args) => {
  const { habit_name } = args;
  if (!habit_name) return { success: false, message: 'Thiếu tên thói quen cần xoá.' };

  const { data: habits, error: fetchError } = await getHabits();
  if (fetchError) throw fetchError;

  const habit = findHabitByName(habits, habit_name);
  if (!habit) {
    return {
      success: false,
      message: `Không tìm thấy thói quen "${habit_name}". Các thói quen hiện có: ${(habits || []).map(h => h.title).join(', ') || 'không có'}`,
    };
  }

  const { error } = await deleteHabit(habit.id);
  if (error) throw error;

  return {
    success: true,
    message: `Đã xoá thói quen "${habit.title}" thành công.`,
  };
};

const executeToggleCompletion = async (args) => {
  const { habit_name, date } = args;
  if (!habit_name) return { success: false, message: 'Thiếu tên thói quen.' };

  const { data: habits, error: fetchError } = await getHabits();
  if (fetchError) throw fetchError;

  const habit = findHabitByName(habits, habit_name);
  if (!habit) {
    return {
      success: false,
      message: `Không tìm thấy thói quen "${habit_name}". Các thói quen hiện có: ${(habits || []).map(h => h.title).join(', ') || 'không có'}`,
    };
  }

  const targetDate = date || formatLocalDate(new Date());
  const { wasCompleted, error } = await toggleCompletion(habit.id, targetDate);
  if (error) throw error;

  return {
    success: true,
    message: wasCompleted
      ? `Đã đánh dấu hoàn thành "${habit.title}" cho ngày ${targetDate}.`
      : `Đã bỏ đánh dấu hoàn thành "${habit.title}" cho ngày ${targetDate}.`,
    data: { habitTitle: habit.title, date: targetDate, wasCompleted },
  };
};

const executeGetTodayProgress = async () => {
  const { data: habits, error: habitsError } = await getHabits();
  if (habitsError) throw habitsError;

  const today = formatLocalDate(new Date());
  const { data: completions, error: compError } = await getCompletionsForDate(new Date());
  if (compError) throw compError;

  const completedIds = new Set((completions || []).map(c => c.habit_id));
  const completed = (habits || []).filter(h => completedIds.has(h.id));
  const remaining = (habits || []).filter(h => !completedIds.has(h.id));

  return {
    success: true,
    message: `Hôm nay (${today}): ${completed.length}/${(habits || []).length} thói quen hoàn thành.`,
    data: {
      date: today,
      total: (habits || []).length,
      completed: completed.map(h => h.title),
      remaining: remaining.map(h => h.title),
    },
  };
};
