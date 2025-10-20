import { Search, Filter, Plus, Mail, Phone, Building2, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Contacts = () => {
  const contacts = [
    { 
      name: "Sarah Chen", 
      role: "Product Manager", 
      company: "Google", 
      email: "sarah.chen@google.com",
      phone: "(415) 555-0123",
      meetingCount: 3,
      lastContact: "2024-01-15",
      nextFollowUp: "2024-02-01",
      thankYouSent: true,
      notes: "Discussed AI product strategy and potential collaboration opportunities."
    },
    { 
      name: "Michael Rodriguez", 
      role: "Software Engineer", 
      company: "Google", 
      email: "m.rodriguez@google.com",
      phone: "(650) 555-0187",
      meetingCount: 2,
      lastContact: "2024-01-20",
      nextFollowUp: "2024-02-05",
      thankYouSent: true,
      notes: "Talked about ML infrastructure and career advice for tech roles."
    },
    { 
      name: "Emma Thompson", 
      role: "Senior UX Designer", 
      company: "Amazon", 
      email: "ethompson@amazon.com",
      phone: "(206) 555-0142",
      meetingCount: 4,
      lastContact: "2024-01-18",
      nextFollowUp: "2024-02-03",
      thankYouSent: false,
      notes: "Portfolio review and discussion about design systems at scale."
    },
    { 
      name: "James Wilson", 
      role: "Data Scientist", 
      company: "Amazon", 
      email: "jwilson@amazon.com",
      phone: "(206) 555-0198",
      meetingCount: 2,
      lastContact: "2024-01-12",
      nextFollowUp: "2024-01-30",
      thankYouSent: true,
      notes: "Explored data science career paths and AWS ML tools."
    },
    { 
      name: "Lisa Park", 
      role: "Product Marketing Manager", 
      company: "Microsoft", 
      email: "lisa.park@microsoft.com",
      phone: "(425) 555-0176",
      meetingCount: 3,
      lastContact: "2024-01-16",
      nextFollowUp: "2024-02-02",
      thankYouSent: true,
      notes: "Discussed marketing strategies for technical products and internship opportunities."
    },
    { 
      name: "David Kim", 
      role: "Research Scientist", 
      company: "Meta", 
      email: "dkim@meta.com",
      phone: "(650) 555-0134",
      meetingCount: 5,
      lastContact: "2024-01-22",
      nextFollowUp: "2024-02-08",
      thankYouSent: true,
      notes: "In-depth conversation about AI research and PhD program recommendations."
    },
    { 
      name: "Alex Johnson", 
      role: "Engineering Manager", 
      company: "Apple", 
      email: "ajohnson@apple.com",
      phone: "(408) 555-0165",
      meetingCount: 2,
      lastContact: "2024-01-19",
      nextFollowUp: "2024-02-04",
      thankYouSent: false,
      notes: "Talked about engineering leadership and Apple's design philosophy."
    },
    { 
      name: "Rachel Green", 
      role: "Cloud Architect", 
      company: "Microsoft", 
      email: "rgreen@microsoft.com",
      phone: "(425) 555-0189",
      meetingCount: 3,
      lastContact: "2024-01-17",
      nextFollowUp: "2024-02-06",
      thankYouSent: true,
      notes: "Azure architecture discussion and cloud computing career insights."
    },
  ];

  // Group contacts by company
  const contactsByCompany = contacts.reduce((acc, contact) => {
    if (!acc[contact.company]) {
      acc[contact.company] = [];
    }
    acc[contact.company].push(contact);
    return acc;
  }, {} as Record<string, typeof contacts>);

  const companies = Object.keys(contactsByCompany).sort();

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Contacts</h1>
          <p className="text-muted-foreground">Manage your professional network</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search contacts..." 
            className="pl-10 bg-card/50 border-border/50"
          />
        </div>
        <Button variant="outline" className="border-border/50 bg-card/50">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Company Filter Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary cursor-pointer hover:bg-primary/20">
          All Companies ({contacts.length})
        </Badge>
        {companies.map(company => (
          <Badge key={company} variant="outline" className="border-border cursor-pointer hover:bg-muted">
            {company} ({contactsByCompany[company].length})
          </Badge>
        ))}
      </div>

      {/* Contacts Grouped by Company */}
      <div className="space-y-8">
        {companies.map(company => (
          <div key={company} className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">{company}</h2>
              <Badge variant="secondary" className="ml-2">
                {contactsByCompany[company].length} {contactsByCompany[company].length === 1 ? 'contact' : 'contacts'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {contactsByCompany[company].map((contact, index) => (
                <Card key={index} className="glass-card border-border hover:border-primary/50 transition-all cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-lg font-bold text-primary-foreground">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {contact.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{contact.role}</p>
                        </div>
                      </div>
                      {contact.thankYouSent ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{contact.phone}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Meeting Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Meetings:</span>
                        <Badge variant="secondary" className="text-xs">{contact.meetingCount}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last: {new Date(contact.lastContact).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Next Follow Up */}
                    <div className="flex items-center justify-between p-2 bg-primary/5 rounded-md">
                      <span className="text-sm font-medium text-foreground">Next Follow-up:</span>
                      <span className="text-sm text-primary font-semibold">
                        {new Date(contact.nextFollowUp).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Conversation Notes */}
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Notes:</span>
                      <p className="text-sm text-foreground leading-relaxed">{contact.notes}</p>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="flex-1">
                        <Mail className="h-3 w-3 mr-2" />
                        Email
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Phone className="h-3 w-3 mr-2" />
                        Call
                      </Button>
                    </div>

                    {!contact.thankYouSent && (
                      <Button size="sm" variant="secondary" className="w-full">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Send Thank You
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Contacts;
