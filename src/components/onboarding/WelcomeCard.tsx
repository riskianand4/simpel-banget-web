import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Crown, ArrowRight } from 'lucide-react';
import { User as UserType } from '@/types/auth';
interface WelcomeCardProps {
  user: UserType;
  onStartTour: () => void;
}
const WelcomeCard: React.FC<WelcomeCardProps> = ({
  user,
  onStartTour
}) => {
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'user':
        return {
          icon: User,
          color: 'bg-blue-500',
          title: 'Staff User',
          description: 'View inventory, products, and generate reports',
          capabilities: ['View Products', 'Check Stock', 'Generate Reports', 'View Analytics']
        };
      case 'superadmin':
        return {
          icon: Crown,
          color: 'bg-purple-500',
          title: 'Super Administrator',
          description: 'Full system access and user management',
          capabilities: ['All Admin Features', 'User Management', 'System Settings', 'Advanced Analytics', 'Security Controls']
        };
      default:
        return {
          icon: User,
          color: 'bg-gray-500',
          title: 'User',
          description: 'Basic access',
          capabilities: []
        };
    }
  };
  const roleInfo = getRoleInfo(user.role);
  const IconComponent = roleInfo.icon;
  return <Card className="mt-4">
      
        
        <Button onClick={onStartTour} className="w-full" variant="outline">
          <ArrowRight className="h-4 w-4 mr-2" />
          Take a Quick Tour
        </Button>
    </Card>;
};
export default WelcomeCard;