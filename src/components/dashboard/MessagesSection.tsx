import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';

interface MessagesSectionProps {
  user: User;
}

export const MessagesSection: React.FC<MessagesSectionProps> = ({ user }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
        <CardDescription>
          Your conversations with clients and workers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-flextasker-200 cursor-pointer transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.role === 'client' ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXZhdGFyfGVufDB8fDB8fHww" : "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXZhdGFyfGVufDB8fDB8fHww"} />
                  <AvatarFallback>{user.role === 'client' ? 'AS' : 'SD'}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="font-medium">{user.role === 'client' ? 'Aashi from Sonipat' : 'Shreesta from Delhi'}</p>
                  <p className="text-sm text-gray-500">Bathroom Plumbing Repair</p>
                </div>
              </div>
              <Badge>2 new</Badge>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {user.role === 'client' 
                ? 'I can come tomorrow at 10 AM if that works for you.'
                : 'That works for me. Do you have all the parts needed?'
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">20 minutes ago</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:border-flextasker-200 cursor-pointer transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.role === 'client' ? "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGluZGlhbiUyMG1hbnxlbnwwfHwwfHx8MA%3D%3D" : "https://images.unsplash.com/photo-1664575599736-c5197c684153?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGluZGlhbiUyMHdvbWFufGVufDB8fDB8fHww"} />
                  <AvatarFallback>{user.role === 'client' ? 'AP' : 'AS'}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="font-medium">{user.role === 'client' ? 'Amit Patel' : 'Aashi from Sonipat'}</p>
                  <p className="text-sm text-gray-500">
                    {user.role === 'client' ? 'Bathroom Plumbing Repair' : 'Living Room Painting'}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {user.role === 'client' 
                ? 'Thank you for the quick service. The sink works great now!'
                : 'The walls look beautiful! Exactly what I wanted.'
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">Yesterday</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
