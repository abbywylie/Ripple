import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, Plus, Filter, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { meetingsApi, contactsApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const Meetings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming"); // upcoming, today, all
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  useEffect(() => {
    loadMeetings();
    loadContacts();
  }, [user?.userId]);

  const loadMeetings = async () => {
    if (!user?.userId) return;
    
    try {
      setLoading(true);
      const meetingsData = await meetingsApi.getUserMeetings(user.userId);
      setMeetings(meetingsData || []);
    } catch (error) {
      console.error("Failed to load meetings:", error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    if (!user?.userId) return;
    
    try {
      const contactsData = await contactsApi.getContacts(user.userId);
      setContacts(contactsData || []);
    } catch (error) {
      console.error("Failed to load contacts:", error);
      setContacts([]);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  const getMeetingStatus = (meeting: any) => {
    if (!meeting.meeting_date) return "scheduled";
    
    const meetingDate = new Date(meeting.meeting_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (meetingDate < today) return "past";
    if (meetingDate.getTime() === today.getTime()) return "today";
    return "upcoming";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "past": return "bg-gray-100 text-gray-600";
      case "today": return "bg-red-100 text-red-600";
      case "upcoming": return "bg-blue-100 text-blue-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getContactName = (contactId: number) => {
    const contact = contacts.find(c => c.contact_id === contactId);
    return contact?.name || "Unknown Contact";
  };

  const filteredMeetings = meetings.filter(meeting => {
    const status = getMeetingStatus(meeting);
    switch (filter) {
      case "today": return status === "today";
      case "upcoming": return status === "upcoming";
      case "all": return true;
      default: return true;
    }
  });

  const sortedMeetings = filteredMeetings.sort((a, b) => {
    // Sort by date, upcoming first, then by date
    const statusA = getMeetingStatus(a);
    const statusB = getMeetingStatus(b);
    
    if (statusA !== statusB) {
      const order = { upcoming: 0, today: 1, past: 2 };
      return order[statusA as keyof typeof order] - order[statusB as keyof typeof order];
    }
    
    return new Date(a.meeting_date || 0).getTime() - new Date(b.meeting_date || 0).getTime();
  });

  const stats = {
    total: meetings.length,
    today: meetings.filter(m => getMeetingStatus(m) === "today").length,
    upcoming: meetings.filter(m => getMeetingStatus(m) === "upcoming").length,
    past: meetings.filter(m => getMeetingStatus(m) === "past").length,
  };

  // Get meetings for a specific date
  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => {
      if (!meeting.meeting_date) return false;
      const meetingDate = new Date(meeting.meeting_date);
      return meetingDate.toDateString() === date.toDateString();
    });
  };

  // Check if a date has meetings
  const hasMeetings = (date: Date) => {
    return getMeetingsForDate(date).length > 0;
  };

  // Get meetings for selected date
  const selectedDateMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Meetings</h1>
          <p className="text-muted-foreground">Manage your scheduled meetings and networking events</p>
        </div>
        <Button onClick={() => navigate('/contacts')}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Meetings</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.past}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for List and Calendar View */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="all">All Meetings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meetings List */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {filter === "all" ? "All Meetings" : filter === "today" ? "Today's Meetings" : "Upcoming Meetings"}
            ({sortedMeetings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedMeetings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filter === "all" ? "No meetings scheduled" : 
                 filter === "today" ? "No meetings today" : 
                 "No upcoming meetings"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === "all" ? "Start building your network by scheduling your first meeting." :
                 filter === "today" ? "You have a free day! Consider reaching out to someone." :
                 "All caught up! Great job staying on top of your networking."}
              </p>
              <Button onClick={() => navigate('/contacts')}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMeetings.map((meeting) => {
                const status = getMeetingStatus(meeting);
                const contactName = getContactName(meeting.contact_id);
                
                return (
                  <div key={meeting.meeting_id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{meeting.meeting_type || "Meeting"}</h3>
                          <Badge className={getStatusColor(status)}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                          {meeting.thank_you && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Thank you sent
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span className="font-medium">Contact:</span>
                            <span className="ml-2">{contactName}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="font-medium">Date:</span>
                            <span className="ml-2">{formatDate(meeting.meeting_date)}</span>
                          </div>
                          
                          {(meeting.start_time || meeting.end_time) && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <span className="font-medium">Time:</span>
                              <span className="ml-2">
                                {meeting.start_time && formatTime(meeting.start_time)}
                                {meeting.start_time && meeting.end_time && " - "}
                                {meeting.end_time && formatTime(meeting.end_time)}
                              </span>
                            </div>
                          )}
                          
                          {meeting.location && (
                            <div className="flex items-center md:col-span-2">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span className="font-medium">Location:</span>
                              <span className="ml-2">{meeting.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {meeting.meeting_notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {meeting.meeting_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/contacts/${meeting.contact_id}`)}
                        >
                          View Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarUI
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    hasMeetings: (date) => hasMeetings(date),
                  }}
                  modifiersClassNames={{
                    hasMeetings: "bg-primary/10 font-bold",
                  }}
                />
              </CardContent>
            </Card>

            {/* Selected Date Meetings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select a Date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedDate ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Click on a date to see meetings</p>
                  </div>
                ) : selectedDateMeetings.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No meetings on this date</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateMeetings.map((meeting) => {
                      const contactName = getContactName(meeting.contact_id);
                      return (
                        <div key={meeting.meeting_id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/contacts/${meeting.contact_id}`)}>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{meeting.meeting_type || "Meeting"}</h4>
                            {meeting.thank_you && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                ✓ Thank you
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{contactName}</p>
                          {meeting.start_time && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(meeting.start_time)}
                            </p>
                          )}
                          {meeting.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {meeting.location}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Meetings;

