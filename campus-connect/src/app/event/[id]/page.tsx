'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User,
  Check,
  Share2,
  Loader2,
  Trash2,
  Edit
} from 'lucide-react';
import { useEvent } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { api, Event, supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import PageTransition from '@/components/PageTransition';
import styles from './page.module.css';

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

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default function EventPage({ params }: EventPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data: event, loading: eventLoading, error, refetch } = useEvent(id);
  const [localEvent, setLocalEvent] = useState<Event | null>(event || null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Update local event when event from hook changes
  useEffect(() => {
    if (event) {
      setLocalEvent(event);
    }
  }, [event]);

  useEffect(() => {
    if (localEvent?.is_attending) {
      setJoined(true);
    }
  }, [localEvent?.is_attending]);

  // Subscribe to real-time updates for this specific event
  useEffect(() => {
    if (!id) return;

    const eventChannel = supabase
      .channel(`event-detail:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${id}`,
        },
        async (payload) => {
          // Event updated - refetch to get full updated data
          console.log('Event updated via real-time:', payload.new);
          await refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${id}`,
        },
        async () => {
          setLocalEvent(null);
          alert('This event has been deleted');
          setTimeout(() => {
            router.push('/event');
          }, 2000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_attendees',
          filter: `event_id=eq.${id}`,
        },
        async () => {
          // Attendee joined - refetch to get updated data
          await refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'event_attendees',
          filter: `event_id=eq.${id}`,
        },
        async () => {
          // Attendee left - refetch to get updated data
          await refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
    };
  }, [id, refetch, router]);

  if (eventLoading) {
    return (
      <PageTransition>
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} size={32} />
          <p>Loading event...</p>
        </div>
      </PageTransition>
    );
  }

  const displayEvent = localEvent || event;

  if (error || (!displayEvent && !eventLoading)) {
    return (
      <PageTransition>
        <div className={styles.notFound}>
          <h1>Event not found</h1>
          <p>This event may have been removed or doesn&apos;t exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </PageTransition>
    );
  }

  if (!displayEvent) {
    return (
      <PageTransition>
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} size={32} />
          <p>Loading event...</p>
        </div>
      </PageTransition>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleJoin = async () => {
    if (!user) {
      router.push('/');
      return;
    }

    setLoading(true);
    try {
      if (joined) {
        // Leave event
        await api.leaveEvent(id, user.id);
        setJoined(false);
      } else {
        // Join event
        await api.joinEvent(id, user.id);
        setJoined(true);
      }
      refetch();
    } catch (err) {
      console.error('Failed to update attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: displayEvent.title,
        text: `Check out this event: ${displayEvent.title}`,
        url: window.location.href,
      });
    }
  };

  const handleDelete = async () => {
    if (!user || !displayEvent) return;
    
    setDeleting(true);
    try {
      const { error } = await api.deleteEvent(id, user.id);
      if (error) {
        alert(`Error: ${error.message || 'Failed to delete event'}`);
      } else {
        alert('Event deleted successfully');
        router.push('/event');
      }
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to delete event'}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isOrganizer = user && displayEvent && displayEvent.organizer_id === user.id;

  const attendeeCount = displayEvent.attendee_count || 0;
  const spotsLeft = displayEvent.max_attendees - attendeeCount;
  const percentFull = (attendeeCount / displayEvent.max_attendees) * 100;

  return (
    <PageTransition>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={styles.backButton}
            onClick={() => router.back()}
          >
            <ArrowLeft size={22} />
          </motion.button>
          <h1 className={styles.headerTitle}>Event Details</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isOrganizer && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                className={styles.shareButton}
                onClick={() => setShowDeleteConfirm(true)}
                style={{ color: '#ef4444' }}
                title="Delete Event"
              >
                <Trash2 size={20} />
              </motion.button>
            )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={styles.shareButton}
            onClick={handleShare}
          >
            <Share2 size={20} />
          </motion.button>
          </div>
        </header>

        {/* Hero Section */}
        <div className={styles.hero}>
          <div 
            className={styles.heroGradient}
            style={{ background: `linear-gradient(135deg, ${categoryColors[displayEvent.category] || '#666'}40 0%, transparent 100%)` }}
          />
          <div className={styles.lottieContainer}>
            <Lottie
              animationData={animationData}
              loop={true}
              className={styles.lottie}
            />
          </div>
          <span 
            className={styles.category}
            style={{ 
              backgroundColor: `${categoryColors[displayEvent.category] || '#666'}30`, 
              color: categoryColors[displayEvent.category] || '#666' 
            }}
          >
            {categoryLabels[displayEvent.category] || displayEvent.category}
          </span>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>{displayEvent.title}</h2>

          {/* Meta Info */}
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <div className={styles.metaIcon}>
                <Calendar size={18} />
              </div>
              <div className={styles.metaContent}>
                <span className={styles.metaLabel}>Date</span>
                <span className={styles.metaValue}>{formatDate(displayEvent.date)}</span>
              </div>
            </div>

            <div className={styles.metaItem}>
              <div className={styles.metaIcon}>
                <Clock size={18} />
              </div>
              <div className={styles.metaContent}>
                <span className={styles.metaLabel}>Time</span>
                <span className={styles.metaValue}>{displayEvent.time}</span>
              </div>
            </div>

            <div className={styles.metaItem}>
              <div className={styles.metaIcon}>
                <MapPin size={18} />
              </div>
              <div className={styles.metaContent}>
                <span className={styles.metaLabel}>Location</span>
                <span className={styles.metaValue}>{displayEvent.location}</span>
              </div>
            </div>

            {displayEvent.organizer && (
              <div className={styles.metaItem}>
                <div className={styles.metaIcon}>
                  <User size={18} />
                </div>
                <div className={styles.metaContent}>
                  <span className={styles.metaLabel}>Organizer</span>
                  <span className={styles.metaValue}>{displayEvent.organizer}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {displayEvent.description && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>About this event</h3>
              <p className={styles.description}>{displayEvent.description}</p>
            </div>
          )}

          {/* Attendance */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Attendance</h3>
            <div className={styles.attendanceCard}>
              <div className={styles.attendanceHeader}>
                <Users size={18} />
                <span>{attendeeCount} attending</span>
                <span className={styles.spotsLeft}>
                  {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                </span>
              </div>
              <div className={styles.progressBar}>
                <motion.div 
                  className={styles.progressFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentFull}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ 
                    background: percentFull > 80 
                      ? 'linear-gradient(90deg, #FF6B6B, #FF8E8E)' 
                      : 'var(--gradient-primary)' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action */}
        <div className={styles.bottomAction}>
          <div className={styles.bottomContent}>
            {isOrganizer ? (
              <Button
                variant="danger"
                size="lg"
                fullWidth
                icon={<Trash2 size={20} />}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Event
              </Button>
            ) : joined ? (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                icon={<Check size={20} />}
                onClick={handleJoin}
                loading={loading}
              >
                You&apos;re Going! 🎉
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onClick={handleJoin}
                disabled={spotsLeft === 0}
              >
                {spotsLeft > 0 ? 'Join Event' : 'Event Full'}
              </Button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div 
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
                Delete Event
              </h2>
              {event && (
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
                  {displayEvent.title}
                </p>
              )}
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                This will permanently delete:
                <br />• The event and all its details
                <br />• All event photos and comments
                <br />• All attendee records
                <br />• All join requests
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleting}
                  style={{ flex: 1 }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
