import { ArrowLeft, Mail, Phone, Calendar, Clock, Plus, Edit, Trash2, Tag, FileText, User, Building2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { contactsApi, interactionsApi } from "@/lib/api";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

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
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
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
      await contactsApi.updateContact({
        contact_id: contact.contact_id,
        user_id: user.userId,
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
        
        <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
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

      {/* Interaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
    </div>
  );
};

export default ContactDetail;
