import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/types';
import React from 'react';

interface MessagesSectionProps {
  user: User;
}

export const MessagesSection: React.FC<MessagesSectionProps> = ({ user }) => {
  // Apply the same semantic bridge pattern we learned from DashboardStats
  // This creates a clear, reusable way to determine user type throughout the component
  const isClient = user.role === 'USER';
  
  // Mock conversation data - in a real app, this would come from props or a data store
  // Notice how we structure this data to make the conditional rendering logic cleaner
  const conversations = [
    {
      id: 1,
      // Dynamic contact info based on user perspective
      contactName: isClient ? 'Aashi from Sonipat' : 'Shreesta from Delhi',
      contactInitials: isClient ? 'AS' : 'SD',
      contactAvatar: isClient 
        ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXZhdGFyfGVufDB8fDB8fHww"
        : "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXZhdGFyfGVufDB8fDB8fHww",
      projectTitle: 'Bathroom Plumbing Repair',
      lastMessage: isClient
        ? 'I can come tomorrow at 10 AM if that works for you.'
        : 'That works for me. Do you have all the parts needed?',
      timestamp: '20 minutes ago',
      unreadCount: 2,
      hasUnread: true
    },
    {
      id: 2,
      contactName: isClient ? 'Amit Patel' : 'Aashi from Sonipat',
      contactInitials: isClient ? 'AP' : 'AS',
      contactAvatar: isClient
        ? "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGluZGlhbiUyMG1hbnxlbnwwfHwwfHx8MA%3D%3D"
        : "https://images.unsplash.com/photo-1664575599736-c5197c684153?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGluZGlhbiUyMHdvbWFufGVufDB8fDB8fHww",
      projectTitle: isClient ? 'Bathroom Plumbing Repair' : 'Living Room Painting',
      lastMessage: isClient
        ? 'Thank you for the quick service. The sink works great now!'
        : 'The walls look beautiful! Exactly what I wanted.',
      timestamp: 'Yesterday',
      unreadCount: 0,
      hasUnread: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
        <CardDescription>
          {/* Dynamic description based on user role - more semantic than hardcoded text */}
          Your conversations with {isClient ? 'service providers' : 'clients'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map through conversations for cleaner, more maintainable code */}
          {conversations.map((conversation) => (
            <div 
              key={conversation.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-flextasker-200 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.contactAvatar} />
                    <AvatarFallback>{conversation.contactInitials}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-medium">{conversation.contactName}</p>
                    <p className="text-sm text-gray-500">{conversation.projectTitle}</p>
                  </div>
                </div>
                {/* Only show unread badge when there are actually unread messages */}
                {conversation.hasUnread && (
                  <Badge>{conversation.unreadCount} new</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">
                {conversation.lastMessage}
              </p>
              <p className="text-xs text-gray-400 mt-1">{conversation.timestamp}</p>
            </div>
          ))}
          
          {/* Empty state when no conversations exist - good UX practice */}
          {conversations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">
                {isClient 
                  ? 'Start a conversation when you hire a service provider'
                  : 'Messages will appear here when clients contact you'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};