import { Search, Filter, Plus, Mail, Phone, Building2, Calendar, Edit, X, Trash2, CheckSquare, Square, CheckCircle, FileText, AlertCircle, Clock, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { contactsApi, interactionsApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GmailPluginDemo } from "@/components/GmailPluginDemo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function to parse date strings as local dates to avoid timezone issues
const parseLocalDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  try {
    // Handle both ISO format (with T) and simple YYYY-MM-DD format
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

// Helper function to calculate contact status (Active, Awaiting Response, Stale)
const calculateContactStatus = (contact: any): { status: 'active' | 'awaiting' | 'stale', label: string, color: string } => {
  const now = new Date();
  const lastInteraction = contact.last_interaction_date 
    ? new Date(contact.last_interaction_date) 
    : contact.date_first_meeting 
    ? new Date(contact.date_first_meeting) 
    : null;
  
  if (!lastInteraction) {
    return { status: 'stale', label: 'Stale Contact', color: 'bg-red-100 text-red-800 border-red-300' };
  }
  
  const daysSinceInteraction = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
  
  // If last interaction was within 7 days, it's active
  if (daysSinceInteraction <= 7) {
    return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800 border-green-300' };
  }
  
  // If last interaction was 8-30 days ago, awaiting response
  if (daysSinceInteraction <= 30) {
    return { status: 'awaiting', label: 'Awaiting Response', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
  }
  
  // More than 30 days, it's stale
  return { status: 'stale', label: 'Stale Contact', color: 'bg-red-100 text-red-800 border-red-300' };
};

// Helper function to calculate follow-up date based on tier and category
// Based on networking consultant recommendations: First 48 hours are critical
const calculateFollowUpDate = (tier: string, category: string): string => {
  const today = new Date();
  let days = 2; // Default
  
  // Tier 1 (Dream) - Most important contacts
  if (tier === "Tier 1") {
    if (category === "Professional") days = 2;  // Critical first 48 hours
    else if (category === "Mentor") days = 1;   // Thank you within 24 hours
    else if (category === "Academic") days = 2;
    else if (category === "Industry") days = 2; // First 48h critical
    else if (category === "Personal") days = 1;
    else if (category === "Friend") days = 1;   // Respond ASAP
    else days = 2;
  }
  // Tier 2 (Great) - Good opportunities
  else if (tier === "Tier 2") {
    if (category === "Professional") days = 2;  // Still critical first 48h
    else if (category === "Mentor") days = 3;   // Give slightly more space
    else if (category === "Academic") days = 2;
    else if (category === "Industry") days = 2;
    else if (category === "Personal") days = 1;
    else if (category === "Friend") days = 1;
    else days = 2;
  }
  // Tier 3 (Curious) - Exploratory
  else {
    if (category === "Professional") days = 3;  // Courteous but less urgent
    else if (category === "Mentor") days = 7;   // Give space
    else if (category === "Academic") days = 3;
    else if (category === "Industry") days = 3;
    else if (category === "Personal") days = 2;
    else if (category === "Friend") days = 1;
    else days = 3;
  }
  
  return new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
};

// Email prompt templates
const EMAIL_TEMPLATES = [
  {
    id: 'coffee-chat',
    title: 'Informational Coffee Chat Request',
    subject: 'Following Up on Our Coffee Chat Request',
    template: `Hi {contactName},

I hope this message finds you well! I really appreciated our conversation during {context}, and I would love to learn more about your career and experiences in {industry}. If you're open to it, I'd be thrilled to schedule a quick coffee chat to hear more about your journey and any advice you may have.

Please let me know if you have some availability in the next couple of weeks. Looking forward to connecting further!

Best regards,
{yourName}`
  },
  {
    id: 'thank-you-interview',
    title: 'After an Informational Interview (Thank You Email)',
    subject: 'Thank You for Your Time',
    template: `Hi {contactName},

Thank you so much for taking the time to meet with me today. I enjoyed learning more about your role at {company} and the path you've taken in {industry}. Your insights about {topic} were really valuable, and I feel more confident about pursuing {action}.

I'd love to stay in touch and continue learning from you. If you have any additional recommendations or resources, I'd greatly appreciate them!

Thanks again, and I look forward to connecting further.

Best regards,
{yourName}`
  },
  {
    id: 'follow-up-application',
    title: 'Follow-Up After Sending a Resume or Application',
    subject: 'Following Up on My Application for {position}',
    template: `Hi {contactName},

I hope you're doing well! I wanted to follow up regarding my recent application for the {position} at {company}. I'm very excited about the opportunity to contribute to {team}, and I believe my skills in {skills} align well with the position.

If there's any additional information you need from me, or if you'd be open to a brief conversation, I'd be grateful to connect.

Thanks so much for your time and consideration!

Best,
{yourName}`
  },
  {
    id: 'post-event-networking',
    title: 'Post-Event Networking Follow-Up',
    subject: 'Great to Meet You at {eventName}',
    template: `Hi {contactName},

It was great to meet you at {eventName}! I really enjoyed our conversation about {topic}, and I'd love to stay in touch.

I'm very interested in learning more about {relatedTopic} and would appreciate any advice or resources you can share. If you're open to it, I'd also love to schedule a brief follow-up conversation or coffee chat in the coming weeks.

Looking forward to staying in touch, and thanks again for your time!

Best regards,
{yourName}`
  },
  {
    id: 'job-interview-thank-you',
    title: 'Thank You After a Job Interview',
    subject: 'Thank You for the Opportunity',
    template: `Hi {contactName},

I wanted to sincerely thank you for taking the time to interview me for the {position} at {company}. I enjoyed learning more about your team's goals and the exciting projects underway at {company}. I'm even more enthusiastic about the role and how my skills can contribute to {area}.

Please let me know if there's any additional information I can provide. I look forward to the possibility of working together.

Best regards,
{yourName}`
  }
];

const Contacts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone_number: '',
    company: '',
    job_title: '',
    category: 'Professional',
    tier: 'Tier 3',
    date_first_meeting: '',
    date_next_follow_up: ''
  });
  const [isEmailPromptDialogOpen, setIsEmailPromptDialogOpen] = useState(false);
  const [selectedContactForEmail, setSelectedContactForEmail] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');

  // Load contacts from API
  useEffect(() => {
    const loadContacts = async () => {
      if (user?.userId) {
        try {
          console.log('Loading contacts for user:', user.userId);
          const contactsData = await contactsApi.getContacts(user.userId);
          console.log('Contacts loaded:', contactsData);
          
          // Load interaction counts for each contact
          const contactsWithInteractions = await Promise.all(
            (Array.isArray(contactsData) ? contactsData : []).map(async (contact) => {
              try {
                const interactions = await interactionsApi.getInteractionsForContact(contact.contact_id, user.userId);
                return {
                  ...contact,
                  interactionCount: Array.isArray(interactions) ? interactions.length : 0
                };
              } catch (error) {
                console.error(`Failed to load interactions for contact ${contact.contact_id}:`, error);
                return {
                  ...contact,
                  interactionCount: 0
                };
              }
            })
          );
          
          setContacts(contactsWithInteractions);
        } catch (error) {
          console.error('Failed to load contacts:', error);
          setContacts([]);
        }
      }
      setLoading(false);
    };

    if (user) {
      loadContacts();
    } else {
      setLoading(false);
    }
  }, [user?.userId, user]);

  // Create new contact
  const handleCreateContact = async () => {
    console.log('handleCreateContact called', { userId: user?.userId, name: newContact.name });
    
    if (!user?.userId) {
      console.error('No user ID available');
      alert('Please log in to create contacts');
      return;
    }
    
    if (!newContact.name.trim()) {
      console.error('Contact name is required');
      alert('Please enter a contact name');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Creating contact with data:', newContact);
      
      const contactData = {
        user_id: user.userId,
        name: newContact.name,
        email: newContact.email || undefined,
        phone_number: newContact.phone_number || undefined,
        company: newContact.company || undefined,
        job_title: newContact.job_title || undefined,
        category: newContact.category || "Professional",
        tier: newContact.tier || "Tier 3",
        date_first_meeting: newContact.date_first_meeting || undefined,
        date_next_follow_up: newContact.date_next_follow_up || undefined,
      };

      console.log('Sending contact data:', contactData);
      const result = await contactsApi.createContact(contactData);
      console.log('Contact created successfully:', result);
      
      // Reload contacts
      const updatedContacts = await contactsApi.getContacts(user.userId);
      setContacts(updatedContacts);
      
      // Reset form and close dialog
      setNewContact({
        name: '',
        email: '',
        phone_number: '',
        company: '',
        job_title: '',
        category: 'Professional',
        tier: 'Tier 3',
        date_first_meeting: '',
        date_next_follow_up: ''
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create contact:', error);
      // You could add a toast notification here to show the error to the user
      alert(`Failed to create contact: ${error.message || error}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Edit contact
  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!user?.userId || !editingContact?.name?.trim()) return;

    try {
      const contactData = {
        contact_id: editingContact.contact_id,
        user_id: user.userId,
        name: editingContact.name,
        email: editingContact.email || undefined,
        phone_number: editingContact.phone_number || undefined,
        company: editingContact.company || undefined,
        job_title: editingContact.job_title || undefined,
        category: editingContact.category || undefined,
        tier: editingContact.tier || undefined,
        date_first_meeting: editingContact.date_first_meeting || undefined,
        date_next_follow_up: editingContact.date_next_follow_up || undefined,
      };

      await contactsApi.updateContact(contactData);
      
      // Reload contacts
      const updatedContacts = await contactsApi.getContacts(user.userId);
      setContacts(updatedContacts);
      
      // Close dialog and reset state
      setIsEditDialogOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  // Delete contact
  const handleDeleteContact = async (contact: any) => {
    if (!user?.userId) return;

    try {
      await contactsApi.deleteContact({
        contact_id: contact.contact_id,
        user_id: user.userId
      });
      
      // Reload contacts
      const updatedContacts = await contactsApi.getContacts(user.userId);
      setContacts(updatedContacts);
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  // Navigate to contact detail
  const handleContactClick = (contact: any) => {
    navigate(`/contacts/${contact.contact_id}`);
  };

  // Handle email button click
  const handleEmailClick = (contact: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContactForEmail(contact);
    setIsEmailPromptDialogOpen(true);
  };

  // Handle template selection
  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    
    // Replace template variables with actual contact data
    const replacements = {
      contactName: selectedContactForEmail?.name || 'Contact Name',
      yourName: user?.name || 'Your Name',
      company: selectedContactForEmail?.company || 'Company',
      industry: selectedContactForEmail?.category || 'your field',
      context: 'our recent conversation',
      topic: 'your work',
      action: 'my goals',
      position: 'the position',
      team: 'your team',
      skills: 'my relevant experience',
      eventName: 'the event',
      relatedTopic: 'your insights',
      area: 'the role'
    };

    let subject = template.subject;
    let content = template.template;

    // Replace variables in subject and content
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, value);
      content = content.replace(regex, value);
    });

    setEmailSubject(subject);
    setEmailContent(content);
  };

  // Handle email composition
  const handleComposeEmail = async () => {
    if (selectedContactForEmail?.email) {
      // If contact has email, open email client
      const mailtoLink = `mailto:${selectedContactForEmail.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailContent)}`;
      window.open(mailtoLink);
    } else {
      // If no email address, copy the text to clipboard
      try {
        const fullEmail = `Subject: ${emailSubject}\n\n${emailContent}`;
        await navigator.clipboard.writeText(fullEmail);
        alert('Email text copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        alert('Failed to copy to clipboard. You can manually copy the email text.');
      }
    }
    
    // Close dialog
    setIsEmailPromptDialogOpen(false);
    setSelectedContactForEmail(null);
    setSelectedTemplate(null);
    setEmailSubject('');
    setEmailContent('');
  };

  // Transform API data to match the UI format and filter by search query
  const transformedContacts = (contacts || [])
    .map(contact => {
      const status = calculateContactStatus(contact);
      return {
        ...contact,
        role: contact?.job_title || 'Unknown',
        phone: contact?.phone_number,
        meetingCount: 0, // This would come from meetings API when integrated
        lastContact: contact?.date_first_meeting || new Date().toISOString().split('T')[0],
        nextFollowUp: contact?.date_next_follow_up || new Date().toISOString().split('T')[0],
        thankYouSent: false, // This would be based on actual data
        notes: "No notes yet", // This would come from notes field
        status: status.status,
        statusLabel: status.label,
        statusColor: status.color,
        relationshipStage: contact?.relationship_stage || null,
        timeline: contact?.timeline ? JSON.parse(contact.timeline) : []
      };
    })
    .filter(contact => {
      if (!searchQuery.trim()) return true;
      if (!contact?.name) return false;
      
      const query = searchQuery.toLowerCase();
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.job_title?.toLowerCase().includes(query)
      );
    });

  // Group contacts by company
  const contactsByCompany = transformedContacts.reduce((acc, contact) => {
    const company = contact.company || 'No Company';
    if (!acc[company]) {
      acc[company] = [];
    }
    acc[company].push(contact);
    return acc;
  }, {} as Record<string, typeof transformedContacts>);

  const companies = Object.keys(contactsByCompany).sort();

  // Debug logging
  console.log('Contacts component render:', { 
    user: user?.userId, 
    loading, 
    contactsLength: contacts?.length, 
    transformedContactsLength: transformedContacts?.length 
  });

  // Safety check - if user is null, show loading or redirect will handle it
  if (!user && !loading) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-2">Contacts</h1>
          <p className="text-muted-foreground">Please log in to view your contacts</p>
        </div>
      </div>
    );
  }

  // Filter contacts by selected company
  const filteredContacts = selectedCompany === 'all' 
    ? transformedContacts 
    : transformedContacts.filter(c => (c.company || 'No Company') === selectedCompany);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h1 className="text-3xl font-bold mb-1">Contacts</h1>
          <p className="text-muted-foreground">Manage your professional network</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
        <Button data-tour="add-contact" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <p className="text-sm text-muted-foreground">Fill in the details below to add a new contact</p>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newContact.phone_number}
                      onChange={(e) => setNewContact({...newContact, phone_number: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={newContact.company}
                      onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                      placeholder="Enter company name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={newContact.job_title}
                      onChange={(e) => setNewContact({...newContact, job_title: e.target.value})}
                      placeholder="Enter job title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newContact.category} onValueChange={(value) => {
                      const followUpDate = calculateFollowUpDate(newContact.tier, value);
                      setNewContact({...newContact, category: value, date_next_follow_up: followUpDate});
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Academic">Academic</SelectItem>
                        <SelectItem value="Industry">Industry</SelectItem>
                        <SelectItem value="Mentor">Mentor</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tier">
                      Tier <span className="text-red-500">*</span>
                    </Label>
                <Select value={newContact.tier} onValueChange={(value) => {
                  const followUpDate = calculateFollowUpDate(value, newContact.category);
                  setNewContact({...newContact, tier: value, date_next_follow_up: followUpDate});
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tier 1">Tier 1 (Dream)</SelectItem>
                    <SelectItem value="Tier 2">Tier 2 (Great)</SelectItem>
                    <SelectItem value="Tier 3">Tier 3 (Curious)</SelectItem>
                  </SelectContent>
                </Select>
                    <p className="text-xs text-muted-foreground">
                      Follow-up date auto-set based on tier & category
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="next_followup">Next Follow-up</Label>
                    <Input
                      id="next_followup"
                      type="date"
                      value={newContact.date_next_follow_up}
                      onChange={(e) => setNewContact({...newContact, date_next_follow_up: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      You can override this date if needed
                    </p>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="first_meeting">First Meeting</Label>
                  <Input
                    id="first_meeting"
                    type="date"
                    value={newContact.date_first_meeting}
                    onChange={(e) => setNewContact({...newContact, date_first_meeting: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateContact} 
                disabled={!newContact.name.trim() || isCreating}
              >
                {isCreating ? 'Adding...' : 'Add Contact'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="edit-name"
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({...editingContact, name: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingContact.email || ''}
                  onChange={(e) => setEditingContact({...editingContact, email: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter email address"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={editingContact.phone_number || ''}
                  onChange={(e) => setEditingContact({...editingContact, phone_number: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-company" className="text-right">
                  Company
                </Label>
                <Input
                  id="edit-company"
                  value={editingContact.company || ''}
                  onChange={(e) => setEditingContact({...editingContact, company: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter company name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-job_title" className="text-right">
                  Job Title
                </Label>
                <Input
                  id="edit-job_title"
                  value={editingContact.job_title || ''}
                  onChange={(e) => setEditingContact({...editingContact, job_title: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter job title"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Category
                </Label>
                <Select value={editingContact.category || 'Professional'} onValueChange={(value) => {
                  const followUpDate = calculateFollowUpDate(editingContact.tier || 'Tier 3', value);
                  setEditingContact({...editingContact, category: value, date_next_follow_up: followUpDate});
                }}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Industry">Industry</SelectItem>
                    <SelectItem value="Mentor">Mentor</SelectItem>
                    <SelectItem value="Friend">Friend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tier" className="text-right">
                  Tier
                </Label>
                <Select value={editingContact.tier || 'Tier 3'} onValueChange={(value) => {
                  const followUpDate = calculateFollowUpDate(value, editingContact.category || 'Professional');
                  setEditingContact({...editingContact, tier: value, date_next_follow_up: followUpDate});
                }}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tier 1">Tier 1 (Dream)</SelectItem>
                    <SelectItem value="Tier 2">Tier 2 (Great)</SelectItem>
                    <SelectItem value="Tier 3">Tier 3 (Curious)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-first_meeting" className="text-right">
                  First Meeting
                </Label>
                <Input
                  id="edit-first_meeting"
                  type="date"
                  value={editingContact.date_first_meeting ? editingContact.date_first_meeting.split('T')[0] : ''}
                  onChange={(e) => setEditingContact({...editingContact, date_first_meeting: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-next_followup" className="text-right">
                  Next Follow-up
                </Label>
                <Input
                  id="edit-next_followup"
                  type="date"
                  value={editingContact.date_next_follow_up ? editingContact.date_next_follow_up.split('T')[0] : ''}
                  onChange={(e) => setEditingContact({...editingContact, date_next_follow_up: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingContact(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateContact} disabled={!editingContact?.name?.trim()}>
              Update Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Prompt Dialog */}
      <Dialog open={isEmailPromptDialogOpen} onOpenChange={setIsEmailPromptDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Email {selectedContactForEmail?.name || 'Contact'}
            </DialogTitle>
          </DialogHeader>
          
          {!selectedTemplate ? (
            // Template selection
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Choose an email template for your follow-up:
              </p>
              <div className="space-y-3">
                {EMAIL_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h4 className="font-medium mb-2">{template.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.subject}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Email composition
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setEmailSubject('');
                    setEmailContent('');
                  }}
                >
                  ← Choose Different Template
                </Button>
                <p className="text-sm text-muted-foreground">
                  Template: {selectedTemplate.title}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject"
                  />
                </div>

                <div>
                  <Label htmlFor="email-content">Email Content</Label>
                  <Textarea
                    id="email-content"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    rows={12}
                    placeholder="Email content"
                    className="resize-none"
                  />
                </div>
              </div>

              {!selectedContactForEmail?.email && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This contact does not have an email address. You can still compose the email and copy the text.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEmailPromptDialogOpen(false);
                    setSelectedContactForEmail(null);
                    setSelectedTemplate(null);
                    setEmailSubject('');
                    setEmailContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleComposeEmail}
                  disabled={!emailSubject.trim()}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {selectedContactForEmail?.email ? 'Open Email Client' : 'Copy Email Text'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Compact Contact List */}
        <div className="w-1/3 border-r flex flex-col">
          {/* Search and Filter */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search contacts..." 
                className="pl-10 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies ({transformedContacts.length})</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company} value={company}>
                    {company} ({contactsByCompany[company].length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading contacts...</p>
                </div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex items-center justify-center py-12 px-4">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'No contacts match your search' : 'No contacts yet'}
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContact?.contact_id === contact.contact_id;
                  return (
                    <Card
                      key={contact.contact_id}
                      className={`rounded-none border-0 border-b cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border-l-4 border-l-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                            {(contact.name || 'N').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">{contact.name || 'Unknown'}</h3>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${contact.statusColor} border`}
                              >
                                {contact.status === 'active' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {contact.status === 'awaiting' && <Clock className="h-3 w-3 mr-1" />}
                                {contact.status === 'stale' && <AlertCircle className="h-3 w-3 mr-1" />}
                                {contact.statusLabel}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                            {contact.company && (
                              <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
                            )}
                            {contact.relationshipStage && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {contact.relationshipStage}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Contact Detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedContact ? (
            <div className="p-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/contacts/${selectedContact.contact_id}`)}
                className="mb-4"
              >
                View Full Details →
              </Button>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedContact.name}</h2>
                  <p className="text-muted-foreground">{selectedContact.role}</p>
                  {selectedContact.company && (
                    <p className="text-muted-foreground">{selectedContact.company}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge className={selectedContact.statusColor}>
                    {selectedContact.statusLabel}
                  </Badge>
                  {selectedContact.relationshipStage && (
                    <Badge variant="outline">{selectedContact.relationshipStage}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {selectedContact.email && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm">{selectedContact.email}</p>
                    </div>
                  )}
                  {selectedContact.phone && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm">{selectedContact.phone}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEmailClick(selectedContact)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" onClick={() => handleEditContact(selectedContact)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a contact to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contacts;
