import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Clock, MapPin, FileText, Edit, Trash2, Send } from "lucide-react";
import { meetingsApi } from "@/lib/api";
import MeetingForm from "./MeetingForm";

interface MeetingListProps {
  contactId: number;
  userId: number;
  onMeetingChange?: () => void;
}

const MeetingList = ({ contactId, userId, onMeetingChange }: MeetingListProps) => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, [contactId]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const meetingsData = await meetingsApi.getMeetingsForContact(contactId);
      setMeetings(meetingsData || []);
    } catch (error) {
      console.error("Failed to load meetings:", error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    try {
      await meetingsApi.deleteMeeting(meetingId);
      await loadMeetings();
      onMeetingChange?.();
    } catch (error) {
      console.error("Failed to delete meeting:", error);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading meetings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Meetings ({meetings.length})
        </CardTitle>
        <MeetingForm 
          contactId={contactId} 
          userId={userId} 
          onMeetingCreated={() => {
            loadMeetings();
            onMeetingChange?.();
          }}
          trigger={
            <Button size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Add Meeting
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No meetings scheduled yet</p>
            <p className="text-sm">Click "Add Meeting" to schedule your first meeting</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings
              .sort((a, b) => {
                // Sort by date, upcoming first, then by date
                const statusA = getMeetingStatus(a);
                const statusB = getMeetingStatus(b);
                
                if (statusA !== statusB) {
                  const order = { upcoming: 0, today: 1, past: 2 };
                  return order[statusA as keyof typeof order] - order[statusB as keyof typeof order];
                }
                
                return new Date(a.meeting_date || 0).getTime() - new Date(b.meeting_date || 0).getTime();
              })
              .map((meeting) => {
                const status = getMeetingStatus(meeting);
                return (
                  <div key={meeting.meeting_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{meeting.meeting_type || "Meeting"}</h4>
                          <Badge className={getStatusColor(status)}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                          {meeting.thank_you && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <Send className="h-3 w-3 mr-1" />
                              Thank you sent
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(meeting.meeting_date)}
                          </div>
                          
                          {(meeting.start_time || meeting.end_time) && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {meeting.start_time && formatTime(meeting.start_time)}
                              {meeting.start_time && meeting.end_time && " - "}
                              {meeting.end_time && formatTime(meeting.end_time)}
                            </div>
                          )}
                          
                          {meeting.location && (
                            <div className="flex items-center md:col-span-2">
                              <MapPin className="h-4 w-4 mr-2" />
                              {meeting.location}
                            </div>
                          )}
                        </div>
                        
                        {meeting.meeting_notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center mb-2">
                              <FileText className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">Notes</span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {meeting.meeting_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <MeetingForm
                          contactId={contactId}
                          userId={userId}
                          existingMeeting={meeting}
                          onMeetingUpdated={() => {
                            loadMeetings();
                            onMeetingChange?.();
                          }}
                          trigger={
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this meeting? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMeeting(meeting.meeting_id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MeetingList;

