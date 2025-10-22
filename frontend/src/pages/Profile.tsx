import { Mail, MapPin, GraduationCap, Briefcase, Phone, Linkedin, Github, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const skills = ["Data Science", "Machine Learning", "Python", "React", "TypeScript", "Statistics"];
  const interests = ["AI Research", "Networking", "Mentorship", "Public Speaking"];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <h1 className="text-4xl font-bold">Profile</h1>
        <Button variant="outline" className="border-border/50 hover:bg-primary/10 hover:text-primary">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <Card className="glass-card border-border/50 lg:col-span-2">
          <CardContent className="p-8">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold flex-shrink-0">
                YK
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">Yu Ning Kao</h2>
                <p className="text-lg text-muted-foreground mb-4">
                  Mathematics & Computer Science Major
                </p>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Student
                  </Badge>
                  <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                    <Briefcase className="h-3 w-3 mr-1" />
                    Aspiring Data Scientist
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:yn.kao@emory.edu" className="hover:text-primary transition-colors">
                  yn.kao@emory.edu
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span>Emory University</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Miami, Florida</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-5 w-5 text-primary" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>

            {/* Bio */}
            <div className="border-t border-border/50 pt-6">
              <h3 className="text-lg font-semibold mb-3">About</h3>
              <p className="text-muted-foreground leading-relaxed">
                Passionate mathematics and computer science student at Emory University with a strong interest in 
                data science and machine learning. Currently building meaningful professional connections and seeking 
                opportunities to apply analytical skills in real-world projects. Dedicated to continuous learning 
                and collaboration with like-minded professionals in the tech industry.
              </p>
            </div>

            {/* Social Links */}
            <div className="border-t border-border/50 pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <div className="flex gap-3">
                <Button variant="outline" className="border-border/50 hover:bg-primary/10 hover:text-primary">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                <Button variant="outline" className="border-border/50 hover:bg-primary/10 hover:text-primary">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Cards */}
        <div className="space-y-6">
          {/* Skills */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <Badge key={index} variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Network Stats */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Network Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Contacts</span>
                <span className="text-2xl font-bold text-primary">42</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Goals</span>
                <span className="text-2xl font-bold text-accent">5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Interactions</span>
                <span className="text-2xl font-bold text-primary">207</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm font-medium">Jan 2025</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Education & Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-lg">Emory University</h4>
              <p className="text-sm text-muted-foreground">Bachelor of Science</p>
              <p className="text-sm text-muted-foreground">Mathematics & Computer Science</p>
              <p className="text-xs text-muted-foreground mt-1">Expected Graduation: May 2026</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-accent" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-2 border-accent pl-4">
              <h4 className="font-semibold text-lg">Research Assistant</h4>
              <p className="text-sm text-muted-foreground">Emory Computer Science Dept</p>
              <p className="text-xs text-muted-foreground mt-1">Sep 2024 - Present</p>
              <p className="text-sm text-muted-foreground mt-2">
                Working on machine learning projects focused on natural language processing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
