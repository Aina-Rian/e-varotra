import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, 
  Calendar, 
  Users, 
  Clock, 
  Download, 
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AnalyticsDashboardProps {
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

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isDark, baseClasses }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    userGrowth: [] as any[],
    eventAttendance: [] as any[],
    userDemographics: {
      organizers: 0,
      attendees: 0,
      speakers: 0
    },
    trafficSources: {
      direct: 0,
      organic: 0,
      referral: 0,
      social: 0
    },
    popularEvents: [] as any[]
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch user growth data
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, created_at, role')
        .order('created_at', { ascending: true });
      
      if (usersError) throw usersError;
      
      // Process user growth data by month
      const usersByMonth = processUserGrowthData(users || []);
      
      // Process user demographics
      const demographics = processUserDemographics(users || []);
      
      // Fetch events data for attendance
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, max_attendees, current_attendees')
        .order('current_attendees', { ascending: false })
        .limit(4);
      
      if (eventsError) throw eventsError;
      
      // Process event attendance data
      const eventAttendance = (events || []).map(event => ({
        event: event.title,
        attendees: event.current_attendees,
        capacity: event.max_attendees
      }));
      
      // Fetch popular events
      const { data: popularEvents, error: popularEventsError } = await supabase
        .from('events')
        .select('id, title, current_attendees, max_attendees')
        .order('current_attendees', { ascending: false })
        .limit(4);
      
      if (popularEventsError) throw popularEventsError;
      
      // Set all the analytics data
      setStats({
        userGrowth: usersByMonth,
        eventAttendance,
        userDemographics: demographics,
        trafficSources: {
          direct: 40,
          organic: 30,
          referral: 20,
          social: 10
        },
        popularEvents: popularEvents || []
      });
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processUserGrowthData = (users: any[]) => {
    // Group users by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const usersByMonth: {[key: string]: number} = {};
    
    // Initialize all months with 0
    months.forEach(month => {
      usersByMonth[month] = 0;
    });
    
    // Count users by month
    users.forEach(user => {
      const date = new Date(user.created_at);
      const month = months[date.getMonth()];
      usersByMonth[month] = (usersByMonth[month] || 0) + 1;
    });
    
    // Convert to array format for chart
    return months.map(month => ({
      month,
      users: usersByMonth[month]
    }));
  };

  const processUserDemographics = (users: any[]) => {
    // Count users by role
    const roleCounts = {
      organizers: 0,
      attendees: 0,
      speakers: 0,
      exhibitors: 0,
      moderators: 0,
      admins: 0
    };
    
    users.forEach(user => {
      switch (user.role) {
        case 'organizer':
          roleCounts.organizers++;
          break;
        case 'attendee':
          roleCounts.attendees++;
          break;
        case 'speaker':
          roleCounts.speakers++;
          break;
        case 'exhibitor':
          roleCounts.exhibitors++;
          break;
        case 'moderator':
          roleCounts.moderators++;
          break;
        case 'admin':
          roleCounts.admins++;
          break;
      }
    });
    
    return {
      organizers: roleCounts.organizers,
      attendees: roleCounts.attendees,
      speakers: roleCounts.speakers,
      exhibitors: roleCounts.exhibitors,
      moderators: roleCounts.moderators,
      admins: roleCounts.admins
    };
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const getTotalUsers = () => {
    const { organizers, attendees, speakers, exhibitors, moderators, admins } = stats.userDemographics;
    return organizers + attendees + speakers + exhibitors + moderators + admins;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibees-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Platform performance metrics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`pl-10 pr-4 py-2 ${baseClasses.input} border ${baseClasses.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-vibees-accent`}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <button 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," 
                + "Month,Users\n"
                + stats.userGrowth.map(item => `${item.month},${item.users}`).join("\n");
              
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "user_growth_data.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              toast.success('Data exported successfully');
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <h3 className="text-2xl font-bold mt-1">{getTotalUsers()}</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                12% increase
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Users className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
              <h3 className="text-2xl font-bold mt-1">{stats.eventAttendance.length}</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                8% increase
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
              <Calendar className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Session Duration</p>
              <h3 className="text-2xl font-bold mt-1">45m 12s</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                5% increase
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
              <Clock className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className={`${baseClasses.card} rounded-xl shadow-sm p-6 border ${baseClasses.border}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</p>
              <h3 className="text-2xl font-bold mt-1">24.8%</h3>
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <ArrowDownRight className="w-3 h-3 mr-1" />
                2% decrease
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-pink-900/30' : 'bg-pink-100'}`}>
              <TrendingUp className={`w-6 h-6 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">User Growth</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-vibees-accent rounded-full mr-1"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">New Users</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-vibees-yellow rounded-full mr-1"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Active Users</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-end space-x-2">
              {stats.userGrowth.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex space-x-1">
                    <div 
                      className="w-1/2 bg-vibees-accent rounded-t-lg" 
                      style={{ height: `${(item.users / (Math.max(...stats.userGrowth.map(d => d.users)) || 1)) * 200}px` }}
                    ></div>
                    <div 
                      className="w-1/2 bg-vibees-yellow rounded-t-lg" 
                      style={{ height: `${(item.users * 0.8 / (Math.max(...stats.userGrowth.map(d => d.users)) || 1)) * 200}px` }}
                    ></div>
                  </div>
                  <div className="text-xs mt-2">{item.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Event Attendance Chart */}
        <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Event Attendance</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-vibees-accent rounded-full mr-1"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Attendees</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full mr-1"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Capacity</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64 flex flex-col justify-between space-y-4">
              {stats.eventAttendance.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{item.event}</span>
                    <span>{item.attendees}/{item.capacity}</span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-vibees-accent rounded-full" 
                      style={{ width: `${(item.attendees / item.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Demographics */}
        <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">User Demographics</h3>
          </div>
          <div className="p-6">
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <div className="absolute inset-0 rounded-full border-8 border-vibees-accent"></div>
                <div 
                  className="absolute inset-0 rounded-full border-8 border-vibees-yellow" 
                  style={{ 
                    clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)',
                    transform: 'rotate(45deg)'
                  }}
                ></div>
                <div 
                  className="absolute inset-0 rounded-full border-8 border-gray-300 dark:border-gray-600" 
                  style={{ 
                    clipPath: 'polygon(50% 50%, 0% 0%, 50% 0%)',
                    transform: 'rotate(45deg)'
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800"></div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-vibees-accent rounded-full mr-2"></div>
                  <span className="text-sm">Organizers</span>
                </div>
                <span className="text-sm font-medium">
                  {calculatePercentage(stats.userDemographics.organizers, getTotalUsers())}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-vibees-yellow rounded-full mr-2"></div>
                  <span className="text-sm">Attendees</span>
                </div>
                <span className="text-sm font-medium">
                  {calculatePercentage(stats.userDemographics.attendees, getTotalUsers())}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full mr-2"></div>
                  <span className="text-sm">Speakers</span>
                </div>
                <span className="text-sm font-medium">
                  {calculatePercentage(stats.userDemographics.speakers, getTotalUsers())}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-300 dark:bg-blue-600 rounded-full mr-2"></div>
                  <span className="text-sm">Exhibitors</span>
                </div>
                <span className="text-sm font-medium">
                  {calculatePercentage(stats.userDemographics.exhibitors, getTotalUsers())}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-300 dark:bg-purple-600 rounded-full mr-2"></div>
                  <span className="text-sm">Moderators</span>
                </div>
                <span className="text-sm font-medium">
                  {calculatePercentage(stats.userDemographics.moderators, getTotalUsers())}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Events */}
        <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Popular Events</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.popularEvents.map((event, index) => (
                <div key={event.id} className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-4">
                    <Calendar className="w-6 h-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{event.title}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <div className="w-full max-w-[120px] h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-vibees-accent rounded-full" 
                          style={{ width: `${(event.current_attendees / event.max_attendees) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {Math.round((event.current_attendees / event.max_attendees) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {stats.popularEvents.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No events data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className={`${baseClasses.card} rounded-xl shadow-sm border ${baseClasses.border} overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Traffic Sources</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Direct</span>
                  <span className="text-sm font-medium">{stats.trafficSources.direct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-vibees-accent rounded-full" 
                    style={{ width: `${stats.trafficSources.direct}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Organic Search</span>
                  <span className="text-sm font-medium">{stats.trafficSources.organic}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-vibees-yellow rounded-full" 
                    style={{ width: `${stats.trafficSources.organic}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Referral</span>
                  <span className="text-sm font-medium">{stats.trafficSources.referral}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${stats.trafficSources.referral}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Social Media</span>
                  <span className="text-sm font-medium">{stats.trafficSources.social}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${stats.trafficSources.social}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;