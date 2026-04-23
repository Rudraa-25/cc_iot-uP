import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Bell, User, HeartPulse } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="h-20 border-b border-border bg-bg-primary/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-accent-cyan/10 p-2 rounded-lg group-hover:bg-accent-cyan/20 transition-colors">
                    <HeartPulse className="w-8 h-8 text-accent-cyan" />
                </div>
                <span className="text-2xl font-black font-syne tracking-tighter">Chain<span className="text-accent-cyan">Pulse</span></span>
            </Link>

            <div className="flex items-center gap-6">
                <button className="relative text-text-secondary hover:text-white transition-colors">
                    <Bell className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-red rounded-full" />
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-border">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-white leading-none">{userProfile?.name}</p>
                        <p className="text-xs text-text-secondary capitalize">{userProfile?.role}</p>
                    </div>
                    <div className="bg-bg-card border border-border p-2 rounded-xl group hover:border-accent-cyan transition-colors cursor-pointer">
                        <User className="w-5 h-5 text-text-secondary group-hover:text-accent-cyan" />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-accent-red/10 rounded-xl transition-colors group"
                    >
                        <LogOut className="w-5 h-5 text-text-secondary group-hover:text-accent-red" />
                    </button>
                </div>
            </div>
        </nav>
    );
};
