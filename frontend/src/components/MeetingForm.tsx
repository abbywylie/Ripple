import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, FileText, Send } from "lucide-react";
import { meetingsApi } from "@/lib/api";

interface MeetingFormProps {
  contactId: number;
  userId: number;
  onMeetingCreated?: () => void;
  onMeetingUpdated?: () => void;
  existingMeeting?: any;
  trigger?: React.ReactNode;
}

const MeetingForm = ({ 
  contactId, 
  userId, 
  onMeetingCreated, 
  onMeetingUpdated, 
  existingMeeting,
  trigger 
}: MeetingFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    meeting_date: existingMeeting?.meeting_date || "",
    start_time: existingMeeting?.start_time || "",
    end_time: existingMeeting?.end_time || "",
    meeting_type: existingMeeting?.meeting_type || "",
    location: existingMeeting?.location || "",
    meeting_notes: existingMeeting?.meeting_notes || "",
    thank_you: existingMeeting?.thank_you || false,
  });

  const meetingTypes = [
    "Coffee Chat",
    "Phone Call",
    "Video Call",
    "Lunch Meeting",
    "Dinner Meeting",
    "Networking Event",
    "Conference Call",
    "In-Person Meeting",
    "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (existingMeeting) {
        // Update existing meeting
        await meetingsApi.updateMeeting(existingMeeting.meeting_id, {
          ...formData,
          user_id: userId,
          contact_id: contactId,
        });
        onMeetingUpdated?.();
      } else {
        // Create new meeting
        await meetingsApi.createMeeting({
          ...formData,
          user_id: userId,
          contact_id: contactId,
        });
        onMeetingCreated?.();
      }
      
      setOpen(false);
      setFormData({
        meeting_date: "",
        start_time: "",
        end_time: "",
        meeting_type: "",
        location: "",
        meeting_notes: "",
        thank_you: false,
      });
    } catch (error) {
      console.error("Failed to save meeting:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {existingMeeting ? "Edit Meeting" : "Add Meeting"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existingMeeting ? "Edit Meeting" : "Schedule New Meeting"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_date">Date</Label>
              <Input
                id="meeting_date"
                type="date"
                value={formData.meeting_date}
                onChange={(e) => handleInputChange("meeting_date", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meeting_type">Meeting Type</Label>
              <Select 
                value={formData.meeting_type} 
                onValueChange={(value) => handleInputChange("meeting_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {meetingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange("start_time", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange("end_time", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Starbucks Downtown, Zoom Link, Office Building"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_notes">Notes</Label>
            <Textarea
              id="meeting_notes"
              placeholder="Meeting agenda, topics to discuss, preparation notes..."
              value={formData.meeting_notes}
              onChange={(e) => handleInputChange("meeting_notes", e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="thank_you"
              checked={formData.thank_you}
              onChange={(e) => handleInputChange("thank_you", e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="thank_you">Thank you note sent</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : existingMeeting ? "Update Meeting" : "Schedule Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingForm;

