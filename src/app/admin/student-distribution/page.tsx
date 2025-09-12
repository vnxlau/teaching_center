'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import { Lock, Unlock, Shuffle, Save } from 'lucide-react';
import { useNotification } from '@/components/NotificationProvider';
import { useLanguage } from '@/contexts/LanguageContext';

interface Student {
  id: string;
  name: string;
  membershipPlan: {
    name: string;
    daysPerWeek: number;
  };
  isLocked: boolean;
  studentId?: string; // For unallocated students
}

interface DaySchedule {
  [key: string]: Student[];
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export default function StudentDistributionPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [daySchedule, setDaySchedule] = useState<DaySchedule>({
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: []
  });
  const [unallocatedStudents, setUnallocatedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();
  const { t } = useLanguage();

  useEffect(() => {
    fetchStudentDistribution();
  }, []);

  const fetchStudentDistribution = async () => {
    try {
      const response = await fetch('/api/admin/student-distribution');
      const data = await response.json();
      setStudents(data.students);
      setDaySchedule(data.daySchedule);
      setUnallocatedStudents(data.unallocatedStudents);
    } catch (error) {
      console.error('Error fetching student distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDistribution = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/student-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daySchedule, unallocatedStudents })
      });
      showNotification('Distribution saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving distribution:', error);
      showNotification('Error saving distribution', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudentLock = (studentId: string) => {
    setStudents(prev => prev.map(student =>
      student.id === studentId
        ? { ...student, isLocked: !student.isLocked }
        : student
    ));

    // Also update in day schedules
    setDaySchedule(prev => {
      const newSchedule = { ...prev };
      Object.keys(newSchedule).forEach(day => {
        newSchedule[day] = newSchedule[day].map(student =>
          student.id === studentId
            ? { ...student, isLocked: !student.isLocked }
            : student
        );
      });
      return newSchedule;
    });
  };

  const autoAllocateStudents = async () => {
    try {
      await fetch('/api/admin/student-distribution', {
        method: 'PUT'
      });
      await fetchStudentDistribution(); // Refresh data
      showNotification('Students auto-allocated successfully!', 'success');
    } catch (error) {
      console.error('Error auto-allocating students:', error);
      showNotification('Error auto-allocating students', 'error');
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    // Parse the draggableId to get the actual student ID
    const parseDraggableId = (draggableId: string) => {
      if (draggableId.includes('-unallocated-')) {
        return draggableId.replace('-unallocated-', '');
      } else {
        // Format: studentId-day-index
        const parts = draggableId.split('-');
        return parts.slice(0, -2).join('-'); // Remove last two parts (day and index)
      }
    };

    const studentId = parseDraggableId(result.draggableId);

    // Helper function to check if student is already scheduled for a day
    const isStudentAlreadyInDay = (studentId: string, day: string) => {
      return daySchedule[day].some(student => student.id === studentId);
    };

    // Handle different drag scenarios
    if (sourceId === destId) {
      // Reordering within the same day - always allowed
      if (sourceId.startsWith('day-')) {
        const day = sourceId.replace('day-', '');
        const newStudents = Array.from(daySchedule[day]);
        const [reorderedItem] = newStudents.splice(source.index, 1);
        newStudents.splice(destination.index, 0, reorderedItem);

        setDaySchedule(prev => ({
          ...prev,
          [day]: newStudents
        }));
      }
    } else if (sourceId === 'unallocated' && destId.startsWith('day-')) {
      // Moving from unallocated to a day
      const day = destId.replace('day-', '');
      const student = unallocatedStudents[source.index];

      // Check if student is already scheduled for this day
      if (isStudentAlreadyInDay(student.id, day)) {
        showNotification(`${student.name} is already scheduled for ${day}. Cannot add duplicate.`, 'warning');
        return;
      }

      setUnallocatedStudents(prev => prev.filter((_, index) => index !== source.index));
      setDaySchedule(prev => ({
        ...prev,
        [day]: [...prev[day], student]
      }));
    } else if (destId === 'unallocated' && sourceId.startsWith('day-')) {
      // Moving from a day to unallocated - always allowed
      const day = sourceId.replace('day-', '');
      const student = daySchedule[day][source.index];

      setDaySchedule(prev => ({
        ...prev,
        [day]: prev[day].filter((_, index) => index !== source.index)
      }));
      setUnallocatedStudents(prev => [...prev, student]);
    } else if (sourceId.startsWith('day-') && destId.startsWith('day-')) {
      // Moving between days
      const sourceDay = sourceId.replace('day-', '');
      const destDay = destId.replace('day-', '');

      const student = daySchedule[sourceDay][source.index];

      // Check if student is already scheduled for the destination day
      if (isStudentAlreadyInDay(student.id, destDay)) {
        showNotification(`${student.name} is already scheduled for ${destDay}. Cannot add duplicate.`, 'warning');
        return;
      }

      setDaySchedule(prev => ({
        ...prev,
        [sourceDay]: prev[sourceDay].filter((_, index) => index !== source.index),
        [destDay]: [...prev[destDay], student]
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">{t.loadingStudentDistribution}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t.studentDistribution}</h1>
          <p className="text-gray-600 mt-2">
            {t.dragDropDescription}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={autoAllocateStudents}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Shuffle className="w-4 h-4" />
            {t.autoAllocate}
          </Button>
          <Button
            onClick={saveDistribution}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? t.saving : t.saveDistribution}
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-12 gap-6">
          {/* Week Calendar - 80% width */}
          <div className="col-span-10">
            <div className="grid grid-cols-5 gap-4">
              {DAYS_OF_WEEK.map(day => (
                <Droppable key={day} droppableId={`day-${day}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-96 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                    >
                      <Card className="h-full">
                        <CardHeader>
                          <CardTitle className="capitalize text-center text-lg">
                            {day.toLowerCase()}
                          </CardTitle>
                          <Badge variant="primary" className="w-fit mx-auto">
                            {daySchedule[day].length} {t.studentsText}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {daySchedule[day].map((student, index) => (
                            <Draggable
                              key={`${student.id}-${day}-${index}`}
                              draggableId={`${student.id}-${day}-${index}`}
                              index={index}
                              isDragDisabled={student.isLocked}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 bg-white border rounded-lg shadow-sm transition-all ${
                                    snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                  } ${student.isLocked ? 'opacity-60 bg-gray-50' : 'hover:shadow-md'}`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{student.name}</div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        {student.membershipPlan.name}
                                      </div>
                                      <div className="text-xs text-blue-600 mt-1">
                                        {student.membershipPlan.daysPerWeek} {t.daysPerWeek}
                                      </div>
                                    </div>
                                    <div className="ml-2">
                                      {student.isLocked ? (
                                        <Lock className="w-4 h-4 text-red-500" />
                                      ) : (
                                        <Unlock className="w-4 h-4 text-green-500" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>

          {/* Student List - 20% width */}
          <div className="col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.students}</CardTitle>
                <p className="text-sm text-gray-600">{t.toggleLocksDescription}</p>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{student.name}</div>
                      <div className="text-xs text-gray-600">
                        {student.membershipPlan.daysPerWeek} {t.daysPerWeek}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={student.isLocked ? "danger" : "outline"}
                      onClick={() => toggleStudentLock(student.id)}
                      className="ml-2 flex-shrink-0"
                    >
                      {student.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Unallocated Students */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.unallocatedStudents}</CardTitle>
              <Badge variant="default">{unallocatedStudents.length} {t.studentsText}</Badge>
              <p className="text-sm text-gray-600">
                {t.dragStudentsDescription}
              </p>
            </CardHeader>
            <CardContent>
              <Droppable droppableId="unallocated" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-wrap gap-2 min-h-24 p-4 border-2 border-dashed rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    {unallocatedStudents.map((student, index) => (
                      <Draggable key={`${student.id}-unallocated-${index}`} draggableId={`${student.id}-unallocated-${index}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 bg-white border rounded-lg shadow-sm transition-all ${
                              snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                            }`}
                          >
                            <div className="font-medium text-sm">{student.name}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {student.membershipPlan.name}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              {student.membershipPlan.daysPerWeek} {t.daysPerWeek}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
        </div>
      </DragDropContext>
    </div>
  );
}
