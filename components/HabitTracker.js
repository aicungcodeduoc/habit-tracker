import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  incrementStreak,
} from '../services/habitService';
import { ViewAllButton } from './molecules';
import { FONTS } from '../config/fonts';

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Load habits on component mount
  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    setLoading(true);
    const { data, error } = await getHabits();
    if (error) {
      Alert.alert('Error', 'Failed to load habits. Please check your Supabase configuration.');
      console.error(error);
    } else {
      setHabits(data || []);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    const { data, error } = await createHabit({ name, description });
    if (error) {
      Alert.alert('Error', 'Failed to create habit');
      console.error(error);
    } else {
      setName('');
      setDescription('');
      loadHabits();
    }
  };

  const handleUpdate = async (id) => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    const { error } = await updateHabit(id, { name, description });
    if (error) {
      Alert.alert('Error', 'Failed to update habit');
      console.error(error);
    } else {
      setName('');
      setDescription('');
      setEditingId(null);
      loadHabits();
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteHabit(id);
            if (error) {
              Alert.alert('Error', 'Failed to delete habit');
              console.error(error);
            } else {
              loadHabits();
            }
          },
        },
      ]
    );
  };

  const handleStreak = async (id) => {
    const { error } = await incrementStreak(id);
    if (error) {
      Alert.alert('Error', 'Failed to update streak');
      console.error(error);
    } else {
      loadHabits();
    }
  };

  const startEdit = (habit) => {
    setEditingId(habit.id);
    setName(habit.name);
    setDescription(habit.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const renderHabit = ({ item }) => (
    <View style={styles.habitCard}>
      <View style={styles.habitHeader}>
        <View style={styles.habitInfo}>
          <Text style={styles.habitName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.habitDescription}>{item.description}</Text>
          ) : null}
          <Text style={styles.streakText}>Streak: {item.streak || 0} days</Text>
        </View>
        <View style={styles.habitActions}>
          <TouchableOpacity
            style={[styles.streakButton, { backgroundColor: item.color || '#4A90E2' }]}
            onPress={() => handleStreak(item.id)}
          >
            <Text style={styles.streakButtonText}>+1</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => startEdit(item)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading habits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Habit Tracker</Text>

      <ScrollView style={styles.formContainer}>
        <Text style={styles.label}>Habit Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Exercise, Read, Meditate"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add a description..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        {editingId ? (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={() => handleUpdate(editingId)}
            >
              <Text style={styles.buttonText}>Update Habit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={cancelEdit}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleCreate}
          >
            <Text style={styles.buttonText}>Add Habit</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>My Habits ({habits.length})</Text>
          {habits.length > 0 && (
            <ViewAllButton
              onPress={() => {
                // Scroll to list if needed, or just show all habits
                // You can add scroll functionality here if using ScrollView
              }}
            />
          )}
        </View>
        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No habits yet. Create your first habit above!</Text>
          </View>
        ) : (
          <FlatList
            data={habits}
            renderItem={renderHabit}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
          />
        )}
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontFamily: FONTS.anton,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    fontFamily: FONTS.anton,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: FONTS.anton,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    fontFamily: FONTS.anton,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#4A90E2',
  },
  updateButton: {
    backgroundColor: '#52C41A',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  editButton: {
    backgroundColor: '#1890FF',
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#FF4D4F',
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.anton,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  listContainer: {
    flex: 1,
    padding: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    fontFamily: FONTS.anton,
  },
  list: {
    flex: 1,
  },
  habitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  habitInfo: {
    flex: 1,
    marginRight: 10,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: FONTS.anton,
  },
  habitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: FONTS.anton,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    fontFamily: FONTS.anton,
  },
  habitActions: {
    alignItems: 'center',
  },
  streakButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
  },
  streakButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: FONTS.anton,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontFamily: FONTS.anton,
  },
});
