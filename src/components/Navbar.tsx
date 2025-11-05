import { Button } from "@/components/ui/button";
import { LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size={40} />
            <span className="text-xl font-bold gradient-text">ServerGem</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-foreground/80 hover:text-foreground transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-foreground/80 hover:text-foreground transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection('architecture')} className="text-foreground/80 hover:text-foreground transition-colors">
              Architecture
            </button>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border/50">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-2 text-foreground/80 hover:text-foreground hover:bg-accent/10 rounded transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left px-4 py-2 text-foreground/80 hover:text-foreground hover:bg-accent/10 rounded transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className="block w-full text-left px-4 py-2 text-foreground/80 hover:text-foreground hover:bg-accent/10 rounded transition-colors"
            >
              Architecture
            </button>
            <div className="px-4">
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
