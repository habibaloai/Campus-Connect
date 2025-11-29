'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Calendar, MapPin, Users, ChevronRight, Loader2 } from 'lucide-react';
import { useEvents } from '@/hooks/useSupabase';
import { Event as EventType, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';
import styles from './EventsTab.module.css';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import animationData from '@/data/lottie-animation.json';

const categoryColors: Record<string, string> = {
  academic: '#4CAF50',
  social: '#FF9800',
  sports: '#2196F3',
  career: '#9C27B0',
  workshop: '#FF6B6B',
};

const categoryLabels: Record<string, string> = {
  academic: '📚 Academic',
  social: '🎉 Social',
  sports: '⚽ Sports',
  career: '💼 Career',
  workshop: '🛠️ Workshop',
};

export default function EventsTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: initialEvents, loading, error, refetch } = useEvents();
  const [events, setEvents] = useState<EventType[]>(initialEvents || []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Update events when initialEvents changes
  useEffect(() => {
    if (initialEvents) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  // Subscribe to real-time event updates
  useEffect(() => {
    if (!user?.id) return;

    const eventsChannel = supabase
      .channel(`events-realtime:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
        },
        async (payload) => {
          const newEvent = payload.new as any;
          // Only add if it's a future event
          if (newEvent.date >= new Date().toISOString().split('T')[0]) {
            setEvents((prev) => {
              if (prev.some((e) => e.id === newEvent.id)) return prev;
              const updated = [...prev, newEvent].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              return updated;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
        },
        async (payload) => {
          const updatedEvent = payload.new as any;
          setEvents((prev) =>
            prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
        },
        async (payload) => {
          const deletedEventId = payload.old.id;
          setEvents((prev) => prev.filter((e) => e.id !== deletedEventId));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_attendees',
        },
        async (payload) => {
          const attendee = payload.new as any;
          setEvents((prev) =>
            prev.map((e) =>
              e.id === attendee.event_id
                ? { ...e, attendee_count: (e.attendee_count || 0) + 1 }
                : e
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'event_attendees',
        },
        async (payload) => {
          const attendee = payload.old as any;
          setEvents((prev) =>
            prev.map((e) =>
              e.id === attendee.event_id
                ? { ...e, attendee_count: Math.max((e.attendee_count || 0) - 1, 0) }
                : e
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  }, [user?.id]);

  const handleEventClick = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load events</p>
        <p className={styles.errorHint}>Please check your connection and try again</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p>No upcoming events</p>
        <p className={styles.emptyHint}>Check back soon for new events!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Upcoming Events</h2>
        <p className={styles.subtitle}>Discover what&apos;s happening on campus</p>
      </div>

      <StaggerContainer className={styles.eventList}>
        {events.map((event: EventType) => (
          <StaggerItem key={event.id}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className={styles.eventCard}
              onClick={() => handleEventClick(event.id)}
            >
              <div className={styles.eventContent}>
                <div className={styles.lottieContainer}>
                  <Lottie
                    animationData={animationData}
                    loop={true}
                    className={styles.lottie}
                  />
                </div>
                
                <div className={styles.eventInfo}>
                  <span 
                    className={styles.category}
                    style={{ 
                      backgroundColor: `${categoryColors[event.category] || '#666'}20`, 
                      color: categoryColors[event.category] || '#666' 
                    }}
                  >
                    {categoryLabels[event.category] || event.category}
                  </span>
                  
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                  
                  <div className={styles.eventMeta}>
                    <div className={styles.metaItem}>
                      <Calendar size={14} />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <MapPin size={14} />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className={styles.attendees}>
                    <Users size={14} />
                    <span>{event.attendee_count || 0}/{event.max_attendees} attending</span>
                    <div className={styles.attendeeBar}>
                      <div 
                        className={styles.attendeeFill}
                        style={{ width: `${((event.attendee_count || 0) / event.max_attendees) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <ChevronRight className={styles.chevron} size={20} />
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
