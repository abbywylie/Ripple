import React, { useState } from "react";
import { Mail, Edit, Trash2, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface MessageSummary {
  id: string;
  createdAt: string;
  summary: string;
}

interface ThreadSummary {
  id: string;
  label: string;
  subject?: string;
  summaries: MessageSummary[];
  is_networking?: boolean;
  meeting_scheduled?: boolean;
  last_updated_ts?: number;
}

interface ContactCardProps {
  contact: any;
  gmailThreads?: ThreadSummary[];
  onStatusChange?: (contactId: number, status: { reachedOut: boolean; contactResponded: boolean; scheduledMeeting: boolean }) => void;
  onEmailClick?: (contact: any) => void;
  onEditClick?: (contact: any) => void;
  onDeleteClick?: (contact: any) => void;
  onViewFullDetails?: (contactId: number) => void;
  onLoadThreadMessages?: (threadId: string) => Promise<MessageSummary[]>;
}

const ContactCard: React.FC<ContactCardProps> = ({ 
  contact, 
  gmailThreads = [],
  onStatusChange,
  onEmailClick,
  onEditClick,
  onDeleteClick,
  onViewFullDetails,
  onLoadThreadMessages
}) => {
  // Map contact data to status
  const [status, setStatus] = useState({
    reachedOut: contact.relationship_stage === "Outreach Sent" || contact.relationship_stage === "Response Received" || contact.relationship_stage === "Meeting Scheduled",
    contactResponded: contact.relationship_stage === "Response Received" || contact.relationship_stage === "Meeting Scheduled",
    scheduledMeeting: contact.relationship_stage === "Meeting Scheduled" || contact.meeting_scheduled || false
  });

  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});

  const toggleStatus = (key: keyof typeof status) => {
    const next = { ...status, [key]: !status[key] };
    setStatus(next);
    onStatusChange?.(contact.contact_id, next);
  };

  const [threadMessages, setThreadMessages] = useState<Record<string, MessageSummary[]>>({});
  const [loadingThreads, setLoadingThreads] = useState<Record<string, boolean>>({});

  const toggleThread = async (threadId: string) => {
    const isOpen = !!openThreads[threadId];
    setOpenThreads(prev => ({
      ...prev,
      [threadId]: !prev[threadId],
    }));

    // Load messages when thread is opened for the first time
    if (!isOpen && !threadMessages[threadId] && onLoadThreadMessages) {
      setLoadingThreads(prev => ({ ...prev, [threadId]: true }));
      try {
        const messages = await onLoadThreadMessages(threadId);
        setThreadMessages(prev => ({ ...prev, [threadId]: messages }));
      } catch (error) {
        console.error(`Failed to load messages for thread ${threadId}:`, error);
      } finally {
        setLoadingThreads(prev => ({ ...prev, [threadId]: false }));
      }
    }
  };

  const renderCheck = (label: string, key: keyof typeof status) => {
    const checked = status[key];

    return (
      <button
        type="button"
        className={`flex items-center gap-1.5 px-1.5 py-1 rounded-lg border transition-colors text-left ${
          checked 
            ? "border-[#d1fae5] bg-[#ecfdf5]" 
            : "border-transparent bg-transparent hover:bg-[#f9fafb]"
        }`}
        onClick={() => toggleStatus(key)}
      >
        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
          checked 
            ? "border-[#10b981] bg-[#10b981]" 
            : "border-[#d1d5db] bg-white"
        }`}>
          {checked && <span className="text-[0.75rem] text-[#ecfdf5] leading-none">✓</span>}
        </span>
        <span className="text-[0.8rem] text-[#374151]">{label}</span>
      </button>
    );
  };

  // Determine if contact needs reply (awaiting response)
  const needsReply = contact.status === 'awaiting' || 
    (contact.last_interaction_date && 
     new Date(contact.last_interaction_date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  // Format last updated date
  const lastUpdated = contact.last_interaction_date 
    ? format(new Date(contact.last_interaction_date), 'MMM d, yyyy')
    : contact.date_first_meeting
    ? format(new Date(contact.date_first_meeting), 'MMM d, yyyy')
    : null;

  // Convert Gmail threads to ThreadSummary format
  const threads: ThreadSummary[] = (gmailThreads || []).map((thread: any, index: number) => ({
    id: thread.id || thread.thread_id || `thread-${index}`,
    label: thread.label || thread.subject || `Thread ${index + 1}`,
    subject: thread.subject,
    summaries: thread.summaries || [],
    is_networking: thread.is_networking,
    meeting_scheduled: thread.meeting_scheduled,
    last_updated_ts: thread.last_updated_ts
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 pb-3 flex flex-col gap-3 shadow-[0_10px_25px_rgba(15,23,42,0.04)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] hover:-translate-y-px transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="text-[0.85rem] font-medium text-[#111827] break-words">
            {contact.email || 'No email'}
          </div>
          {contact.name && (
            <div className="text-[0.8rem] text-[#4b5563]">
              {contact.name}
            </div>
          )}
        </div>

        <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
          {needsReply && (
            <span className="px-2.5 py-0.5 rounded-full text-[0.7rem] bg-[#fef3c7] border border-[#fed7aa] text-[#b45309] whitespace-nowrap">
              Contact reached out first, awaiting your reply
            </span>
          )}
          {lastUpdated && (
            <div className="text-[0.7rem] text-[#9ca3af]">
              Last updated: {lastUpdated}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex justify-between gap-3">
        {/* Checklist */}
        <div className="flex flex-col gap-1.5 pr-3 mr-3 border-r border-gray-200 flex-shrink-0">
          <div className="text-[0.7rem] uppercase tracking-wider text-[#9ca3af] mb-0.5">
            Status
          </div>
          {renderCheck("Reached Out", "reachedOut")}
          {renderCheck("Contact Responded", "contactResponded")}
          {renderCheck("Scheduled Meeting", "scheduledMeeting")}
        </div>

        {/* Threads */}
        <div className="flex-1 min-w-0">
          <details className="rounded-xl bg-[#f3f4f6] px-2.5 py-2">
            <summary className="list-none cursor-pointer text-[0.8rem] font-medium text-[#4b5563] [&::-webkit-details-marker]:hidden">
              Threads ({threads.length})
            </summary>
            <div className="mt-1 flex flex-col gap-1">
              {threads.map((thread) => {
                const isOpen = !!openThreads[thread.id];

                return (
                  <div key={thread.id} className="rounded">
                    <button
                      type="button"
                      className={`w-full px-1.5 py-1 rounded-[0.65rem] border text-[0.78rem] flex items-center justify-between font-medium transition-colors ${
                        isOpen
                          ? "bg-[#eff6ff] border-[#bfdbfe]"
                          : "bg-white border-gray-200"
                      }`}
                      onClick={() => toggleThread(thread.id)}
                    >
                      <span className="truncate">{thread.label}</span>
                      <span className="text-[0.7rem] text-[#6b7280] ml-2">
                        {isOpen ? "▾" : "▸"}
                      </span>
                    </button>

                    <ol
                      className="mt-1.5 pl-4.5 flex flex-col gap-1"
                      style={{ display: isOpen ? "flex" : "none" }}
                    >
                      {loadingThreads[thread.id] ? (
                        <li className="text-[0.76rem] text-[#9ca3af]">Loading messages...</li>
                      ) : (threadMessages[thread.id] || thread.summaries || []).length > 0 ? (
                        (threadMessages[thread.id] || thread.summaries || []).map((msg) => (
                          <li
                            key={msg.id}
                            className="text-[0.76rem] text-[#4b5563]"
                          >
                            <div className="text-[0.7rem] text-[#9ca3af]">
                              {msg.createdAt}
                            </div>
                            <div className="mt-0.5">
                              {msg.summary}
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-[0.76rem] text-[#9ca3af]">No messages available</li>
                      )}
                    </ol>
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        {onEmailClick && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onEmailClick(contact)}
            className="flex-1"
          >
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
        )}
        {onEditClick && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onEditClick(contact)}
            className="flex-1"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
        {onDeleteClick && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{contact.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteClick(contact)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {onViewFullDetails && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onViewFullDetails(contact.contact_id)}
            className="flex-1"
          >
            View Full Details →
          </Button>
        )}
      </div>
    </div>
  );
};

export default ContactCard;

