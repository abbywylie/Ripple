import { ArrowLeft, Mail, Phone, Calendar, Clock, Plus, Edit, Trash2, Tag, FileText, User, Building2, Clipboard, Sparkles, CheckCircle, AlertCircle, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { contactsApi, interactionsApi, meetingsApi, gmailApi } from "@/lib/api";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import MeetingList from "@/components/MeetingList";
import { ContactTimeline, TimelineStage } from "@/components/ContactTimeline";
import { ContactChecklist } from "@/components/ContactChecklist";

// Helper function to parse date strings as local dates to avoid timezone issues
const parseLocalDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  try {
    const cleanDate = dateString.split('T')[0];
    const dateParts = cleanDate.split('-');
    if (dateParts.length === 3) {
      return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    }
    return new Date(dateString);
  } catch {
    return null;
  }
};

const ContactDetail = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contact, setContact] = useState<any>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineStage[]>([]);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [isEmailPasteDialogOpen, setIsEmailPasteDialogOpen] = useState(false);
  const [emailText, setEmailText] = useState("");
  const [parsedEmail, setParsedEmail] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [editingMeetingDetails, setEditingMeetingDetails] = useState<any>(null);
  const [isEditMeetingDialogOpen, setIsEditMeetingDialogOpen] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    interaction_type: 'email',
    subject: '',
    content: '',
    tag: '',
    direction: 'outbound',
    interaction_date: new Date().toISOString().split('T')[0],
    interaction_time: '',
    follow_up_required: false,
    follow_up_date: ''
  });
  const [gmailThreads, setGmailThreads] = useState<any[]>([]);
  const [gmailMessages, setGmailMessages] = useState<Record<string, any[]>>({});
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loadingGmail, setLoadingGmail] = useState(false);

  // Load contact and interactions
  useEffect(() => {
    const loadContactData = async () => {
      if (!user?.userId || !contactId) return;
      
      try {
        setLoading(true);
        // Load contacts first to find the specific contact
        const contacts = await contactsApi.getContacts(user.userId);
        const foundContact = contacts.find(c => c.contact_id === parseInt(contactId));
        
        if (foundContact) {
          setContact(foundContact);
          // Load interactions for this contact
          const interactionsData = await interactionsApi.getInteractionsForContact(parseInt(contactId), user.userId);
          setInteractions(Array.isArray(interactionsData) ? interactionsData : []);
        }
      } catch (error) {
        console.error('Failed to load contact data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId && contactId) {
      loadContactData();
    }
  }, [user?.userId, contactId]);

  // Load Gmail threads for this contact
  useEffect(() => {
    const loadGmailThreads = async () => {
      if (!user?.userId || !contact?.email) return;
      
      try {
        setLoadingGmail(true);
        const threads = await gmailApi.getThreads(contact.email);
        setGmailThreads(threads || []);
      } catch (error) {
        console.error('Failed to load Gmail threads:', error);
        // Don't show error toast - Gmail data is optional
      } finally {
        setLoadingGmail(false);
      }
    };

    if (contact?.email) {
      loadGmailThreads();
    }
  }, [user?.userId, contact?.email]);

  // Load messages for selected thread
  useEffect(() => {
    const loadThreadMessages = async () => {
      if (!selectedThreadId || gmailMessages[selectedThreadId]) return;
      
      try {
        const messages = await gmailApi.getThreadMessages(selectedThreadId);
        setGmailMessages(prev => ({ ...prev, [selectedThreadId]: messages || [] }));
      } catch (error) {
        console.error('Failed to load thread messages:', error);
      }
    };

    if (selectedThreadId) {
      loadThreadMessages();
    }
  }, [selectedThreadId]);

  // Create new interaction
  const handleCreateInteraction = async () => {
    if (!user?.userId || !contactId || !newInteraction.subject.trim()) return;

    try {
      await interactionsApi.createInteraction({
        user_id: user.userId,
        contact_id: parseInt(contactId),
        interaction_type: newInteraction.interaction_type,
        subject: newInteraction.subject,
        content: newInteraction.content,
        tag: newInteraction.tag,
        direction: newInteraction.direction,
        interaction_date: newInteraction.interaction_date,
        interaction_time: newInteraction.interaction_time || undefined,
        follow_up_required: newInteraction.follow_up_required,
        follow_up_date: newInteraction.follow_up_date || undefined,
      });

      // Reload interactions
      const interactionsData = await interactionsApi.getInteractionsForContact(parseInt(contactId), user.userId);
      setInteractions(Array.isArray(interactionsData) ? interactionsData : []);

      // Reset form and close dialog
      setNewInteraction({
        interaction_type: 'email',
        subject: '',
        content: '',
        tag: '',
        direction: 'outbound',
        interaction_date: new Date().toISOString().split('T')[0],
        interaction_time: '',
        follow_up_required: false,
        follow_up_date: ''
      });
      setIsInteractionDialogOpen(false);
    } catch (error) {
      console.error('Failed to create interaction:', error);
      alert(`Failed to create interaction: ${error}`);
    }
  };

  // Delete interaction
  const handleDeleteInteraction = async (interaction: any) => {
    if (!user?.userId) return;

    try {
      await interactionsApi.deleteInteraction({
        interaction_id: interaction.interaction_id,
        user_id: user.userId,
      });

      // Reload interactions
      const interactionsData = await interactionsApi.getInteractionsForContact(parseInt(contactId!), user.userId);
      setInteractions(Array.isArray(interactionsData) ? interactionsData : []);
    } catch (error) {
      console.error('Failed to delete interaction:', error);
    }
  };

  // Set follow-up reminder based on interaction
  const handleSetFollowUp = async (contact: any, followUpDate: string) => {
    if (!user?.userId) return;

    try {
      await contactsApi.updateContact(contact.contact_id, {
        date_next_follow_up: followUpDate,
      });
      
      // Reload contact data
      const contacts = await contactsApi.getContacts(user.userId);
      const updatedContact = contacts.find(c => c.contact_id === parseInt(contactId!));
      if (updatedContact) {
        setContact(updatedContact);
      }
    } catch (error) {
      console.error('Failed to set follow-up:', error);
    }
  };

  // Parse email thread
  const handleParseEmail = async () => {
    if (!emailText.trim()) return;
    
    try {
      setIsParsing(true);
      const result = await interactionsApi.parseEmail(emailText);
      setParsedEmail(result);
      toast.success('Email parsed successfully!');
    } catch (error: any) {
      console.error('Failed to parse email:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      toast.error(`Failed to parse email: ${error?.response?.data?.detail || error?.message || 'Unknown error'}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Log parsed email as interaction
  const handleLogEmail = async () => {
    if (!user?.userId || !contactId || !parsedEmail) return;
    
    try {
      const result = await interactionsApi.logEmail(
        user.userId,
        parseInt(contactId),
        emailText,
        parsedEmail.suggested_tag
      );
      
      toast.success('Email logged successfully!');
      
      // Reload interactions
      const interactionsData = await interactionsApi.getInteractionsForContact(parseInt(contactId), user.userId);
      setInteractions(Array.isArray(interactionsData) ? interactionsData : []);
      
      // Close dialog and reset
      setIsEmailPasteDialogOpen(false);
      setEmailText("");
      setParsedEmail(null);
    } catch (error) {
      console.error('Failed to log email:', error);
      toast.error('Failed to log email');
    }
  };

  // Create meeting from parsed email details
  const handleCreateMeetingFromEmail = async () => {
    if (!user?.userId || !contactId) return;
    
    const meetingDetails = editingMeetingDetails || parsedEmail?.parsed_data.meeting_details;
    if (!meetingDetails) {
      toast.error('No meeting details found');
      return;
    }
    
    try {
      // Parse date string to ISO format for database
      let meetingDate = meetingDetails.date;
      if(typeof meetingDetails.date !== 'string'){
        //if not a string convert
        try {  
          meetingDate = format(meetingDate, "yyyy-MM-dd");
        } catch {
          toast.error('Invalid date format');
          return;
        }
      }
      
      const meetingData = {
        user_id: user.userId,
        contact_id: parseInt(contactId),
        meeting_title: parsedEmail?.parsed_data.subject || 'Meeting',
        meeting_date: meetingDate,
        meeting_time: meetingDetails.time || '',
        meeting_location: meetingDetails.location || '',
        meeting_notes: `Meeting details from email${meetingDetails.platform ? ` - Platform: ${meetingDetails.platform}` : ''}`,
        meeting_type: meetingDetails.platform?.toLowerCase() || 'in-person'
      };
      
      await meetingsApi.createMeeting(meetingData);
      
      toast.success('Meeting added successfully!');
      
      // Don't close the dialog - let user also log the email if they want
      // Just clear the editing state
      setEditingMeetingDetails(null);
    } catch (error: any) {
      console.error('Failed to create meeting:', error);
      toast.error(`Failed to create meeting: ${error?.response?.data?.detail || error?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    if (!user?.userId) return;

    try {
      await meetings.Api.deleteMeeting({ meeting_id: meetingId, user_id: user.userId, });
      toast.success('Meeting deleted successfully!');
      const contacts = await contactsApi.getContacts(user.userId);
      const updatedContact = contacts.find(c => c.contact_id === parseInt(contactId!));
      if(updatedContact){
        setContact(updatedContact);
      }
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };
  
  const getInteractionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'call':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading contact details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Contact Not Found</h1>
          <p className="text-muted-foreground mb-4">The contact you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/contacts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/contacts')} className="p-0">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold mb-2">{contact.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{contact.category || 'Professional'}</Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{contact.job_title || 'No title'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isEmailPasteDialogOpen} onOpenChange={setIsEmailPasteDialogOpen}>
            <DialogTrigger asChild>
              <Button data-tour="paste-email" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Clipboard className="h-4 w-4 mr-2" />
                Paste Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clipboard className="h-5 w-5 text-primary" />
                  Paste Email Thread
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email_text">Email Thread</Label>
                  <Textarea
                    id="email_text"
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    placeholder="Paste your email conversation here..."
                    className="mt-2 font-mono text-sm"
                    rows={12}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Copy and paste the full email thread (with headers) for automatic parsing
                  </p>
                </div>

                {!parsedEmail && (
                  <Button onClick={handleParseEmail} disabled={!emailText.trim() || isParsing} className="w-full">
                    {isParsing ? (
                      <>Analyzing...</>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Parse Email
                      </>
                    )}
                  </Button>
                )}

                {parsedEmail && (
                  <div className="space-y-4 border rounded-lg p-4">
                    {/* Parsed Info */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Parsed Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Suggested Tag:</span>
                          <Badge className="ml-2">{parsedEmail.suggested_tag}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Message Count:</span>
                          <span className="ml-2 font-medium">{parsedEmail.parsed_data.message_count}</span>
                        </div>
                        {parsedEmail.parsed_data.subject && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Subject:</span>
                            <span className="ml-2 font-medium">{parsedEmail.parsed_data.subject}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meeting Details */}
                    {parsedEmail.parsed_data.meeting_details && (
                      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
                          <Calendar className="h-4 w-4" />
                          Meeting Detected
                        </h4>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-20">Date:</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className="w-full justify-start text-left font-normal bg-white"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editingMeetingDetails?.date || parsedEmail.parsed_data.meeting_details.date || "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={editingMeetingDetails?.selectedDate}
                                  onSelect={(date) => {
                                    const formattedDate = date ? format(date, "MMMM d, yyyy") : '';
                                    setEditingMeetingDetails({
                                      ...(editingMeetingDetails || parsedEmail.parsed_data.meeting_details),
                                      date: formattedDate,
                                      selectedDate: date
                                    });
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-20">Time:</span>
                            <Input
                              value={editingMeetingDetails?.time || parsedEmail.parsed_data.meeting_details.time || ''}
                              onChange={(e) => setEditingMeetingDetails({...(editingMeetingDetails || parsedEmail.parsed_data.meeting_details), time: e.target.value})}
                              placeholder="e.g., 3:00 PM"
                              className="bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-20">Location:</span>
                            <Input
                              value={editingMeetingDetails?.location || parsedEmail.parsed_data.meeting_details.location || ''}
                              onChange={(e) => setEditingMeetingDetails({...(editingMeetingDetails || parsedEmail.parsed_data.meeting_details), location: e.target.value})}
                              placeholder="e.g., Blue Bottle Coffee"
                              className="bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-20">Platform:</span>
                            <Input
                              value={editingMeetingDetails?.platform || parsedEmail.parsed_data.meeting_details.platform || ''}
                              onChange={(e) => setEditingMeetingDetails({...(editingMeetingDetails || parsedEmail.parsed_data.meeting_details), platform: e.target.value})}
                              placeholder="e.g., Zoom, Google Meet"
                              className="bg-white"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleCreateMeetingFromEmail}
                          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Add to Calendar
                        </Button>
                      </div>
                    )}

                    {/* Smart Suggestions */}
                    {parsedEmail.suggestions && parsedEmail.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          Smart Suggestions
                        </h4>
                        <div className="space-y-2">
                          {parsedEmail.suggestions.map((suggestion: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                              <Sparkles className="h-4 w-4 text-amber-600 mt-0.5" />
                              <p className="text-sm text-amber-900">{suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setParsedEmail(null);
                          setEmailText("");
                        }}
                        className="flex-1"
                      >
                        Clear & Start Over
                      </Button>
                      <Button
                        onClick={handleLogEmail}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Log This Email
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
            <DialogTrigger asChild>
              <Button data-tour="log-interaction" className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Log Interaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log New Interaction</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="interaction_type" className="text-right">
                  Type
                </Label>
                <Select value={newInteraction.interaction_type} onValueChange={(value) => setNewInteraction({...newInteraction, interaction_type: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="text">Text Message</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="direction" className="text-right">
                  Direction
                </Label>
                <Select value={newInteraction.direction} onValueChange={(value) => setNewInteraction({...newInteraction, direction: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="mutual">Mutual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject *
                </Label>
                <Input
                  id="subject"
                  value={newInteraction.subject}
                  onChange={(e) => setNewInteraction({...newInteraction, subject: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter subject or brief description"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tag" className="text-right">
                  Tag
                </Label>
                <Input
                  id="tag"
                  value={newInteraction.tag}
                  onChange={(e) => setNewInteraction({...newInteraction, tag: e.target.value})}
                  className="col-span-3"
                  placeholder="e.g., First Contact, Follow-Up, Project Discussion"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right">
                  Content/Notes
                </Label>
                <Textarea
                  id="content"
                  value={newInteraction.content}
                  onChange={(e) => setNewInteraction({...newInteraction, content: e.target.value})}
                  className="col-span-3"
                  rows={4}
                  placeholder="Enter email content, call notes, or meeting details..."
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="interaction_date" className="text-right">
                  Date
                </Label>
                <Input
                  id="interaction_date"
                  type="date"
                  value={newInteraction.interaction_date}
                  onChange={(e) => setNewInteraction({...newInteraction, interaction_date: e.target.value})}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="interaction_time" className="text-right">
                  Time (optional)
                </Label>
                <Input
                  id="interaction_time"
                  type="time"
                  value={newInteraction.interaction_time}
                  onChange={(e) => setNewInteraction({...newInteraction, interaction_time: e.target.value})}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="follow_up_required" className="text-right">
                  Follow-up Required
                </Label>
                <Select 
                  value={newInteraction.follow_up_required.toString()} 
                  onValueChange={(value) => setNewInteraction({...newInteraction, follow_up_required: value === 'true'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newInteraction.follow_up_required && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="follow_up_date" className="text-right">
                    Follow-up Date
                  </Label>
                  <Input
                    id="follow_up_date"
                    type="date"
                    value={newInteraction.follow_up_date}
                    onChange={(e) => setNewInteraction({...newInteraction, follow_up_date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsInteractionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateInteraction} 
                disabled={!newInteraction.subject.trim()}
              >
                Log Interaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{contact.email || 'Not provided'}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Phone</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{contact.phone_number || 'Not provided'}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Company</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{contact.company || 'Not provided'}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Next Follow-up</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                {contact.date_next_follow_up ? 
                  (() => {
                    const date = parseLocalDate(contact.date_next_follow_up);
                    return date ? date.toLocaleDateString() : 'Not set';
                  })() : 'Not set'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline, Checklist, and Notes Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Relationship Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="gmail">Gmail {gmailThreads.length > 0 && `(${gmailThreads.length})`}</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="mt-4">
              <ContactTimeline
                timeline={timeline}
                currentStage={contact?.relationship_stage || null}
                onStageUpdate={async (stage, completed, notes) => {
                  // Update timeline and relationship stage
                  const updatedTimeline = [...timeline];
                  const existingIndex = updatedTimeline.findIndex(t => t.stage === stage);
                  const timelineEntry = {
                    stage,
                    completed,
                    timestamp: completed ? new Date().toISOString() : null,
                    notes: notes || null
                  };
                  
                  if (existingIndex >= 0) {
                    updatedTimeline[existingIndex] = timelineEntry;
                  } else {
                    updatedTimeline.push(timelineEntry);
                  }
                  
                  setTimeline(updatedTimeline);
                  
                  // Update contact via API
                  try {
                    await contactsApi.updateContact(contact.contact_id, {
                      relationship_stage: stage,
                      timeline: JSON.stringify(updatedTimeline),
                      last_interaction_date: new Date().toISOString().split('T')[0]
                    });
                    toast.success('Timeline updated');
                    // Reload contact data
                    const contacts = await contactsApi.getContacts(user?.userId || 0);
                    const foundContact = contacts.find(c => c.contact_id === parseInt(contactId || '0'));
                    if (foundContact) {
                      setContact(foundContact);
                      if (foundContact.timeline) {
                        try {
                          const parsedTimeline = typeof foundContact.timeline === 'string' 
                            ? JSON.parse(foundContact.timeline) 
                            : foundContact.timeline;
                          setTimeline(Array.isArray(parsedTimeline) ? parsedTimeline : []);
                        } catch (e) {
                          console.error('Failed to parse timeline:', e);
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Failed to update timeline:', error);
                    toast.error('Failed to update timeline');
                  }
                }}
              />
            </TabsContent>
            <TabsContent value="checklist" className="mt-4">
              <ContactChecklist
                timeline={timeline}
                onToggle={async (stage, completed) => {
                  const updatedTimeline = [...timeline];
                  const existingIndex = updatedTimeline.findIndex(t => t.stage === stage);
                  const timelineEntry = {
                    stage,
                    completed,
                    timestamp: completed ? new Date().toISOString() : null,
                    notes: existingIndex >= 0 ? updatedTimeline[existingIndex].notes : null
                  };
                  
                  if (existingIndex >= 0) {
                    updatedTimeline[existingIndex] = timelineEntry;
                  } else {
                    updatedTimeline.push(timelineEntry);
                  }
                  
                  setTimeline(updatedTimeline);
                  
                  try {
                    await contactsApi.updateContact(contact.contact_id, {
                      timeline: JSON.stringify(updatedTimeline)
                    });
                    toast.success('Checklist updated');
                    // Reload contact data
                    const contacts = await contactsApi.getContacts(user?.userId || 0);
                    const foundContact = contacts.find(c => c.contact_id === parseInt(contactId || '0'));
                    if (foundContact && foundContact.timeline) {
                      try {
                        const parsedTimeline = typeof foundContact.timeline === 'string' 
                          ? JSON.parse(foundContact.timeline) 
                          : foundContact.timeline;
                        setTimeline(Array.isArray(parsedTimeline) ? parsedTimeline : []);
                      } catch (e) {
                        console.error('Failed to parse timeline:', e);
                      }
                    }
                  } catch (error) {
                    console.error('Failed to update checklist:', error);
                    toast.error('Failed to update checklist');
                  }
                }}
              />
            </TabsContent>
            <TabsContent value="gmail" className="mt-4">
              {loadingGmail ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading Gmail data...</span>
                </div>
              ) : gmailThreads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No Gmail threads found for this contact.</p>
                  <p className="text-sm mt-2">Make sure you've run the Gmail plugin to sync your emails.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gmailThreads.map((thread) => (
                    <Card key={thread.thread_id} className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setSelectedThreadId(selectedThreadId === thread.thread_id ? null : thread.thread_id)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-semibold">{thread.subject || 'No subject'}</h4>
                              {thread.meeting_scheduled && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Meeting
                                </Badge>
                              )}
                              {thread.is_networking && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  Networking
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {thread.contact_email}
                            </p>
                            {thread.last_updated_ts && (
                              <p className="text-xs text-muted-foreground">
                                Last updated: {format(new Date(thread.last_updated_ts * 1000), 'MMM d, yyyy h:mm a')}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedThreadId === thread.thread_id && (
                          <div className="mt-4 pt-4 border-t">
                            {gmailMessages[thread.thread_id] ? (
                              <div className="space-y-3">
                                {gmailMessages[thread.thread_id].map((message, idx) => (
                                  <div key={message.gmail_id || idx} className="pl-4 border-l-2 border-primary/20">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant={message.direction === 'sent' ? 'default' : 'secondary'}>
                                        {message.direction === 'sent' ? 'Sent' : 'Received'}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(message.timestamp * 1000), 'MMM d, yyyy h:mm a')}
                                      </span>
                                    </div>
                                    {message.summary && (
                                      <p className="text-sm mt-2">{message.summary}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                Loading messages...
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Add notes about this contact..."
                  className="min-h-[200px]"
                />
                <Button>Save Notes</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Interaction History */}
      <Card>
        <CardHeader>
          <CardTitle data-tour="interactions-section" className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Interaction History ({interactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No interactions yet</h3>
              <p className="text-muted-foreground mb-4">Start building your relationship history by logging your first interaction.</p>
              <Button onClick={() => setIsInteractionDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log First Interaction
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {interactions.map((interaction, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getInteractionColor(interaction.interaction_type)}`}>
                        {getInteractionIcon(interaction.interaction_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{interaction.subject}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {interaction.interaction_type}
                          </Badge>
                          {interaction.tag && (
                            <Badge variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {interaction.tag}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{interaction.direction}</span>
                          <span>•</span>
                          <span>
                            {(() => {
                              const date = parseLocalDate(interaction.interaction_date);
                              return date ? date.toLocaleDateString() : 'Unknown date';
                            })()}
                          </span>
                          {interaction.interaction_time && (
                            <>
                              <span>•</span>
                              <span>{interaction.interaction_time}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Interaction</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this interaction? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteInteraction(interaction)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  {interaction.content && (
                    <div className="ml-11">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interaction.content}</p>
                    </div>
                  )}

                  {interaction.follow_up_required && interaction.follow_up_date && (
                    <div className="ml-11">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-600 font-medium">
                          Follow-up required: {(() => {
                            const date = parseLocalDate(interaction.follow_up_date);
                            return date ? date.toLocaleDateString() : 'Unknown date';
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meetings */}
      {user?.userId && contactId && (
        <div data-tour="meetings-section">
          <MeetingList 
            contactId={parseInt(contactId)} 
            userId={user.userId}
            //onDeleteMeeting={handleDeleteMeeting} 
            onMeetingChange={() => {
              // Optionally reload contact data if needed
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ContactDetail;
