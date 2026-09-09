import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  AlertCircle, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Flag,
  Shield,
  WifiOff,
  Loader2,
  User,
  Calendar,
  Clock,
  Trash2,
  X,
  HelpCircle,
  Info,
  Bell
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ModerationPanelProps {
  isDark: boolean;
  baseClasses: {
    background: string;
    sidebar: string;
    card: string;
    border: string;
    text: string;
    input: string;
    accent: string;
    yellow: string;
  };
}

interface ContentItem {
  id: string;
  type: 'message' | 'question';
  content: string;
  created_at: string;
  user_id: string | null;
  user_name?: string;
  user_avatar?: string;
  speaker_id?: string | null;
  speaker_name?: string;
  session_id: string;
  session_title?: string;
  event_id?: string;
  event_title?: string;
  status?: 'pending' | 'answered' | 'flagged' | 'approved';
  flagged?: boolean;
  flagged_reason?: string;
  flagged_by?: string;
  flagged_at?: string;
}

interface Report {
  id: string;
  content_id: string;
  content_type: 'message' | 'question';
  content: string;
  reported_by: string;
  reported_at: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  user_id: string | null;
  user_name?: string;
  speaker_id?: string | null;
  speaker_name?: string;
  session_id?: string;
  session_title?: string;
  event_id?: string;
  event_title?: string;
}

interface Event {
  id: string;
  title: string;
}

interface Session {
  id: string;
  title: string;
  event_id: string;
}

export const ModerationPanel: React.FC<ModerationPanelProps> = ({ isDark, baseClasses }) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'questions' | 'reports'>('messages');
  const [contentFilter, setContentFilter] = useState<'all' | 'flagged' | 'pending'>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [actionLogs, setActionLogs] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'report' | 'delete' | null;
    item: ContentItem | null;
  }>({ type: null, item: null });

  useEffect(() => {
    fetchEvents();
    fetchSessions();
    fetchContentItems();
    fetchReports();
  }, []);

  useEffect(() => {
    // Filter sessions based on selected event
    if (selectedEventId === 'all') {
      setFilteredSessions(sessions);
    } else {
      setFilteredSessions(sessions.filter(session => session.event_id === selectedEventId));
    }
    // Reset session selection when event changes
    setSelectedSessionId('all');
  }, [selectedEventId, sessions]);

  const addLog = (message: string) => {
    console.log(`[ModerationPanel] ${message}`);
    setActionLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .order('title', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      addLog(`Error fetching events: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, event_id')
        .order('title', { ascending: true });
      
      if (error) throw error;
      setSessions(data || []);
      setFilteredSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      addLog(`Error fetching sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const fetchContentItems = async () => {
    try {
      setLoading(true);
      
      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('session_messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          speaker_id,
          session_id,
          sessions:session_id(
            title,
            event_id,
            events:event_id(title)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (messagesError) throw messagesError;
      
      // Fetch questions
      const { data: questions, error: questionsError } = await supabase
        .from('session_questions')
        .select(`
          id,
          question,
          status,
          created_at,
          user_id,
          session_id,
          sessions:session_id(
            title,
            event_id,
            events:event_id(title)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (questionsError) throw questionsError;
      
      // Fetch user details for all content items
      const userIds = new Set([
        ...(messages || []).map(m => m.user_id),
        ...(questions || []).map(q => q.user_id)
      ].filter(Boolean));
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(userIds).filter(id => id !== null));
      
      if (usersError) throw usersError;
      
      // Fetch speaker details for messages with speaker_id
      const speakerIds = new Set(
        (messages || [])
          .map(m => m.speaker_id)
          .filter(Boolean)
      );
      
      const { data: speakers, error: speakersError } = await supabase
        .from('speakers')
        .select('id, full_name, photo_url')
        .in('id', Array.from(speakerIds).filter(id => id !== null));
      
      if (speakersError) throw speakersError;
      
      // Create a map of user details
      const userMap = (users || []).reduce((map, user) => {
        map[user.id] = {
          name: user.full_name,
          avatar: user.avatar_url
        };
        return map;
      }, {} as Record<string, { name: string, avatar: string | null }>);
      
      // Create a map of speaker details
      const speakerMap = (speakers || []).reduce((map, speaker) => {
        map[speaker.id] = {
          name: speaker.full_name,
          avatar: speaker.photo_url
        };
        return map;
      }, {} as Record<string, { name: string, avatar: string | null }>);
      
      // Format messages
      const formattedMessages: ContentItem[] = (messages || []).map(msg => {
        let userName = 'Unknown User';
        let userAvatar = undefined;
        
        if (msg.user_id && userMap[msg.user_id]) {
          userName = userMap[msg.user_id].name;
          userAvatar = userMap[msg.user_id].avatar || undefined;
        } else if (msg.speaker_id && speakerMap[msg.speaker_id]) {
          userName = speakerMap[msg.speaker_id].name;
          userAvatar = speakerMap[msg.speaker_id].avatar || undefined;
        }
        
        return {
          id: msg.id,
          type: 'message',
          content: msg.content,
          created_at: msg.created_at,
          user_id: msg.user_id,
          speaker_id: msg.speaker_id,
          user_name: userName,
          user_avatar: userAvatar,
          session_id: msg.session_id,
          session_title: msg.sessions?.title || 'Unknown Session',
          event_id: msg.sessions?.event_id,
          event_title: msg.sessions?.events?.title || 'Unknown Event',
          status: 'approved',
          flagged: Math.random() < 0.2 // Simulate some messages being flagged
        };
      });
      
      // Format questions
      const formattedQuestions: ContentItem[] = (questions || []).map(q => {
        let userName = 'Unknown User';
        let userAvatar = undefined;
        
        if (q.user_id && userMap[q.user_id]) {
          userName = userMap[q.user_id].name;
          userAvatar = userMap[q.user_id].avatar || undefined;
        }
        
        return {
          id: q.id,
          type: 'question',
          content: q.question,
          created_at: q.created_at,
          user_id: q.user_id,
          user_name: userName,
          user_avatar: userAvatar,
          session_id: q.session_id,
          session_title: q.sessions?.title || 'Unknown Session',
          event_id: q.sessions?.event_id,
          event_title: q.sessions?.events?.title || 'Unknown Event',
          status: q.status,
          flagged: Math.random() < 0.2 // Simulate some questions being flagged
        };
      });
      
      // Combine and sort by creation date
      const combined = [...formattedMessages, ...formattedQuestions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setContentItems(combined);
      addLog(`Fetched ${combined.length} content items (${formattedMessages.length} messages, ${formattedQuestions.length} questions)`);
    } catch (error) {
      console.error('Error fetching content items:', error);
      toast.error('Failed to load content items');
      addLog(`Error fetching content items: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      // In a real implementation, you would fetch from a reports table
      // For now, we'll generate some sample reports based on flagged content
      
      const sampleReports: Report[] = contentItems
        .filter(item => item.flagged)
        .map(item => ({
          id: `report-${item.id}`,
          content_id: item.id,
          content_type: item.type,
          content: item.content,
          reported_by: 'system',
          reported_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Random time in the last week
          reason: ['Inappropriate content', 'Spam', 'Harassment', 'Misinformation'][Math.floor(Math.random() * 4)],
          status: ['pending', 'reviewed', 'dismissed'][Math.floor(Math.random() * 3)] as 'pending' | 'reviewed' | 'dismissed',
          user_id: item.user_id,
          speaker_id: item.speaker_id,
          user_name: item.user_name,
          session_id: item.session_id,
          session_title: item.session_title,
          event_id: item.event_id,
          event_title: item.event_title
        }));
      
      setReports(sampleReports);
      addLog(`Fetched ${sampleReports.length} reports`);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
      addLog(`Error fetching reports: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleApproveContent = async (item: ContentItem) => {
    try {
      addLog(`Approving ${item.type} with ID: ${item.id}`);
      
      if (item.type === 'question') {
        const { error } = await supabase
          .from('session_questions')
          .update({ status: 'answered' })
          .eq('id', item.id);
        
        if (error) throw error;
      }
      
      // Update local state
      setContentItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, status: 'approved', flagged: false } 
            : i
        )
      );
      
      toast.success(`${item.type === 'question' ? 'Question' : 'Message'} approved successfully`);
      addLog(`Successfully approved ${item.type} with ID: ${item.id}`);
    } catch (error) {
      console.error('Error approving content:', error);
      toast.error('Failed to approve content');
      addLog(`Error approving ${item.type} with ID: ${item.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleReportContent = (item: ContentItem) => {
    setSelectedItem(item);
    setShowReportModal(true);
  };

  const confirmReportContent = (item: ContentItem) => {
    setConfirmAction({
      type: 'report',
      item
    });
  };

  const confirmDeleteContent = (item: ContentItem) => {
    setConfirmAction({
      type: 'delete',
      item
    });
  };

  const submitReport = async () => {
    if (!selectedItem || !reportReason) return;
    
    try {
      addLog(`Reporting ${selectedItem.type} with ID: ${selectedItem.id}. Reason: ${reportReason}`);
      
      // In a real implementation, you would insert into a reports table
      // For now, we'll just update our local state
      
      // Update content item to be flagged
      setContentItems(prev => 
        prev.map(item => 
          item.id === selectedItem.id 
            ? { 
                ...item, 
                flagged: true, 
                flagged_reason: reportReason,
                flagged_by: 'admin',
                flagged_at: new Date().toISOString()
              } 
            : item
        )
      );
      
      // Add to reports
      const newReport: Report = {
        id: `report-${Date.now()}`,
        content_id: selectedItem.id,
        content_type: selectedItem.type,
        content: selectedItem.content,
        reported_by: 'admin',
        reported_at: new Date().toISOString(),
        reason: reportReason,
        status: 'pending',
        user_id: selectedItem.user_id,
        speaker_id: selectedItem.speaker_id,
        user_name: selectedItem.user_name,
        session_id: selectedItem.session_id,
        session_title: selectedItem.session_title,
        event_id: selectedItem.event_id,
        event_title: selectedItem.event_title
      };
      
      setReports(prev => [newReport, ...prev]);
      
      toast.success('Content reported successfully');
      addLog(`Successfully reported ${selectedItem.type} with ID: ${selectedItem.id}`);
      
      // Close modal and reset
      setShowReportModal(false);
      setSelectedItem(null);
      setReportReason('');
      setConfirmAction({ type: null, item: null });
    } catch (error) {
      console.error('Error reporting content:', error);
      toast.error('Failed to report content');
      addLog(`Error reporting ${selectedItem.type} with ID: ${selectedItem.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDeleteContent = async () => {
    if (!confirmAction.item) return;
    const item = confirmAction.item;
    
    try {
      addLog(`Deleting ${item.type} with ID: ${item.id}`);
      
      if (item.type === 'message') {
        const { error } = await supabase
          .from('session_messages')
          .delete()
          .eq('id', item.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('session_questions')
          .delete()
          .eq('id', item.id);
        
        if (error) throw error;
      }
      
      // Update local state
      setContentItems(prev => prev.filter(i => i.id !== item.id));
      
      // Also remove any reports for this content
      setReports(prev => prev.filter(report => report.content_id !== item.id));
      
      toast.success(`${item.type === 'question' ? 'Question' : 'Message'} deleted successfully`);
      addLog(`Successfully deleted ${item.type} with ID: ${item.id}`);
      
      // Reset confirmation state
      setConfirmAction({ type: null, item: null });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
      addLog(`Error deleting ${item.type} with ID: ${item.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleReviewReport = async (report: Report, action: 'approve' | 'dismiss') => {
    try {
      addLog(`Reviewing report ${report.id} with action: ${action}`);
      
      // In a real implementation, you would update the report status in the database
      // For now, we'll just update our local state
      
      setReports(prev => 
        prev.map(r => 
          r.id === report.id 
            ? { ...r, status: action === 'approve' ? 'reviewed' : 'dismissed' } 
            : r
        )
      );
      
      // If approved, also update the content item
      if (action === 'approve') {
        setContentItems(prev => 
          prev.map(item => 
            item.id === report.content_id 
              ? { ...item, flagged: true } 
              : item
          )
        );
      } else {
        // If dismissed, unflag the content
        setContentItems(prev => 
          prev.map(item => 
            item.id === report.content_id 
              ? { ...item, flagged: false } 
              : item
          )
        );
      }
      
      toast.success(`Report ${action === 'approve' ? 'approved' : 'dismissed'} successfully`);
      addLog(`Successfully ${action === 'approve' ? 'approved' : 'dismissed'} report ${report.id}`);
    } catch (error) {
      console.error('Error reviewing report:', error);
      toast.error('Failed to review report');
      addLog(`Error reviewing report ${report.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getFilteredContentItems = () => {
    return contentItems.filter(item => {
      // Filter by type
      if (activeTab === 'messages' && item.type !== 'message') return false;
      if (activeTab === 'questions' && item.type !== 'question') return false;
      
      // Apply content filter
      if (contentFilter === 'flagged' && !item.flagged) return false;
      if (contentFilter === 'pending' && item.type === 'question' && item.status !== 'pending') return false;
      
      // Filter by event
      if (selectedEventId !== 'all' && item.event_id !== selectedEventId) return false;
      
      // Filter by session
      if (selectedSessionId !== 'all' && item.session_id !== selectedSessionId) return false;
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.content.toLowerCase().includes(query) ||
          (item.user_name?.toLowerCase().includes(query) || false) ||
          (item.session_title?.toLowerCase().includes(query) || false) ||
          (item.event_title?.toLowerCase().includes(query) || false)
        );
      }
      
      return true;
    });
  };

  const filteredReports = reports.filter(report => {
    // Apply report filter
    if (reportFilter === 'pending' && report.status !== 'pending') return false;
    if (reportFilter === 'reviewed' && report.status !== 'reviewed') return false;
    
    // Filter by event
    if (selectedEventId !== 'all' && report.event_id !== selectedEventId) return false;
    
    // Filter by session
    if (selectedSessionId !== 'all' && report.session_id !== selectedSessionId) return false;
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.content.toLowerCase().includes(query) ||
        (report.user_name?.toLowerCase().includes(query) || false) ||
        (report.session_title?.toLowerCase().includes(query) || false) ||
        (report.event_title?.toLowerCase().includes(query) || false) ||
        report.reason.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <p className="text-gray-500 dark:text-gray-400">Monitor and manage user-generated content</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'messages'
                ? baseClasses.accent
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-2 inline-block" />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'questions'
                ? baseClasses.accent
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <HelpCircle className="w-4 h-4 mr-2 inline-block" />
            Questions
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'reports'
                ? baseClasses.accent
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Flag className="w-4 h-4 mr-2 inline-block" />
            Reports
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 w-full ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {activeTab === 'reports' ? (
              <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value as 'all' | 'pending' | 'reviewed')}
                className={`pl-10 pr-4 py-2 w-full ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
              >
                <option value="all">All Reports</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
              </select>
            ) : (
              <select
                value={contentFilter}
                onChange={(e) => setContentFilter(e.target.value as 'all' | 'flagged' | 'pending')}
                className={`pl-10 pr-4 py-2 w-full ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
              >
                <option value="all">All Content</option>
                <option value="flagged">Flagged</option>
                <option value="pending">Pending</option>
              </select>
            )}
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className={`pl-10 pr-4 py-2 w-full ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className={`pl-10 pr-4 py-2 w-full ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
              disabled={selectedEventId === 'all' && filteredSessions.length > 50}
            >
              <option value="all">All Sessions</option>
              {filteredSessions.map(session => (
                <option key={session.id} value={session.id}>{session.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content List */}
      {(activeTab === 'messages' || activeTab === 'questions') && (
        <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">
              {activeTab === 'messages' ? 'Messages' : 'Questions'}
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-vibees-accent mr-3" />
              <span>Loading content...</span>
            </div>
          ) : getFilteredContentItems().length === 0 ? (
            <div className="text-center py-12">
              {activeTab === 'messages' ? (
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              ) : (
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              )}
              <p className="text-gray-500">No {activeTab} found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getFilteredContentItems().map((item) => (
                <div 
                  key={item.id} 
                  className={`p-6 ${
                    item.flagged ? 'bg-red-50 dark:bg-red-900/10' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {item.user_avatar ? (
                          <img 
                            src={item.user_avatar} 
                            alt={item.user_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.user_name || 'Unknown User'}</p>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            <Clock className="w-3 h-3 ml-2 mr-1" />
                            <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            In {item.event_title} / {item.session_title}
                          </p>
                        </div>
                        
                        <div className="flex space-x-1">
                          {item.type === 'question' && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                            }`}>
                              {item.status}
                            </span>
                          )}
                          
                          {item.flagged && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                              flagged
                            </span>
                          )}
                          
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                            {item.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p>{item.content}</p>
                      </div>
                      
                      <div className="mt-3 flex justify-end space-x-2">
                        <button
                          onClick={() => handleApproveContent(item)}
                          className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        
                        <button
                          onClick={() => confirmReportContent(item)}
                          className="flex items-center px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          Report
                        </button>
                        
                        <button
                          onClick={() => confirmDeleteContent(item)}
                          className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports List */}
      {activeTab === 'reports' && (
        <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Abuse Reports</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-vibees-accent mr-3" />
              <span>Loading reports...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reports found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.map((report) => (
                <div 
                  key={report.id} 
                  className={`p-6 ${
                    report.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/10' : 
                    report.status === 'reviewed' ? 'bg-green-50 dark:bg-green-900/10' : 
                    'bg-gray-50 dark:bg-gray-800/10'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{report.user_name || 'Unknown User'}</p>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{new Date(report.reported_at).toLocaleDateString()}</span>
                            <Clock className="w-3 h-3 ml-2 mr-1" />
                            <span>{new Date(report.reported_at).toLocaleTimeString()}</span>
                          </div>
                          {report.session_title && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              In {report.event_title} / {report.session_title}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            report.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' 
                              : report.status === 'reviewed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {report.status}
                          </span>
                          
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                            {report.content_type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <p>{report.content}</p>
                        </div>
                        
                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            Reported for: {report.reason}
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-300">
                            Reported by: {report.reported_by === 'system' ? 'Automated System' : 'Moderator'}
                          </p>
                        </div>
                      </div>
                      
                      {report.status === 'pending' && (
                        <div className="mt-3 flex justify-end space-x-2">
                          <button
                            onClick={() => handleReviewReport(report, 'approve')}
                            className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve Report
                          </button>
                          
                          <button
                            onClick={() => handleReviewReport(report, 'dismiss')}
                            className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Dismiss Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Logs */}
      <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Action Logs</h2>
        </div>
        <div className="p-4 max-h-64 overflow-y-auto">
          {actionLogs.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No actions logged yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actionLogs.map((log, index) => (
                <div 
                  key={index} 
                  className="text-xs font-mono p-2 bg-gray-50 dark:bg-gray-800/50 rounded"
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Confirmation Modal */}
      {confirmAction.type === 'report' && confirmAction.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${baseClasses.card} rounded-xl shadow-xl w-full max-w-lg`}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Confirm Report</h3>
                <button
                  onClick={() => setConfirmAction({ type: null, item: null })}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Are you sure you want to report the following content?
                </p>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p>{confirmAction.item.content}</p>
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Posted by {confirmAction.item.user_name} in {confirmAction.item.session_title}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Reason for reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className={`w-full px-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Spam">Spam</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Misinformation">Misinformation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmAction({ type: null, item: null })}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(confirmAction.item);
                    submitReport();
                  }}
                  disabled={!reportReason}
                  className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
                    !reportReason ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Confirm Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmAction.type === 'delete' && confirmAction.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${baseClasses.card} rounded-xl shadow-xl w-full max-w-md`}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Confirm Deletion</h3>
                <button
                  onClick={() => setConfirmAction({ type: null, item: null })}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-center">
                  Are you sure you want to delete this {confirmAction.item.type}? This action cannot be undone.
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-6">
                <p>{confirmAction.item.content}</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmAction({ type: null, item: null })}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteContent}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ModerationPanel;