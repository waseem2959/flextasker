import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React from 'react';

const MigrationDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[hsl(206,33%,16%)]">
        Database Migration Dashboard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Migration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[hsl(220,14%,46%)]">Current Version</span>
              <Badge>v2.4.1</Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[hsl(220,14%,46%)]">Target Version</span>
              <Badge variant="outline">v3.0.0</Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[hsl(220,14%,46%)]">Status</span>
              <Badge className="bg-[hsl(38,92%,50%)]">Pending</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Migration Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-[hsl(220,14%,46%)]">Schema Updates</span>
                  <span className="text-sm font-medium">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-[hsl(220,14%,46%)]">Data Migration</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-[hsl(220,14%,46%)]">Validation</span>
                  <span className="text-sm font-medium">0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Migration Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full">Start Migration</Button>
              <Button variant="outline" className="w-full">Pause Migration</Button>
              <Button variant="destructive" className="w-full">Rollback</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Migration Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] overflow-auto">
            <div className="space-y-2">
              <div className="p-2 border-b border-[hsl(215,16%,90%)]">
                <div className="flex justify-between">
                  <span className="font-medium">Schema Update Completed</span>
                  <span className="text-sm text-[hsl(220,14%,46%)]">2023-10-22 09:45</span>
                </div>
                <p className="text-sm text-[hsl(220,14%,46%)]">All database schema changes have been applied successfully.</p>
              </div>
              
              <div className="p-2 border-b border-[hsl(215,16%,90%)]">
                <div className="flex justify-between">
                  <span className="font-medium">Data Migration Started</span>
                  <span className="text-sm text-[hsl(220,14%,46%)]">2023-10-22 09:50</span>
                </div>
                <p className="text-sm text-[hsl(220,14%,46%)]">Beginning transfer of user data to new schema.</p>
              </div>
              
              <div className="p-2 border-b border-[hsl(215,16%,90%)]">
                <div className="flex justify-between">
                  <span className="font-medium">Warning: Slow Progress</span>
                  <span className="text-sm text-[hsl(220,14%,46%)]">2023-10-22 10:15</span>
                </div>
                <p className="text-sm text-[hsl(220,14%,46%)]">Data migration is proceeding slower than expected. Estimated completion time: 2 hours.</p>
              </div>
              
              <div className="p-2 border-b border-[hsl(215,16%,90%)]">
                <div className="flex justify-between">
                  <span className="font-medium">Progress Update</span>
                  <span className="text-sm text-[hsl(220,14%,46%)]">2023-10-22 11:30</span>
                </div>
                <p className="text-sm text-[hsl(220,14%,46%)]">Data migration is 45% complete. Continuing with user transaction history.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MigrationDashboard;
