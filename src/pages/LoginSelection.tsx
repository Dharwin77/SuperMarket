import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Wallet, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'admin',
      title: 'Admin Portal',
      description: 'Full system access for administrators',
      icon: Shield,
      color: 'from-blue-500 to-cyan-500',
      route: '/login/admin',
    },
    {
      id: 'cashier',
      title: 'Cashier Portal',
      description: 'Billing and checkout operations',
      icon: Wallet,
      color: 'from-green-500 to-emerald-500',
      route: '/login/cashier',
    },
    {
      id: 'staff',
      title: 'Staff Portal',
      description: 'Inventory and stock management',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      route: '/login/staff',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">
            SuperMarket
          </h1>
          <p className="text-muted-foreground text-lg">
            Select your role to access the management system
          </p>
        </motion.div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-panel border-border hover:border-primary/50 transition-all cursor-pointer group h-full">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div
                      className={`h-16 w-16 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <role.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl text-foreground">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate(role.route)}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    Login as {role.id.charAt(0).toUpperCase() + role.id.slice(1)}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
