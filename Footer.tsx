import { Link } from "@tanstack/react-router";
import { Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Cpu className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Gerber<span className="gradient-text">GPT</span></span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            The futuristic AI assistant for electronics, PCB design, and circuit innovation.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            <li><Link to="/chat" className="hover:text-foreground">AI Chat</Link></li>
            <li><Link to="/pcb" className="hover:text-foreground">PCB Mode</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><a href="mailto:gerbergpt143@gmail.com" className="hover:text-foreground">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Get in touch</h4>
          <p className="text-sm text-muted-foreground">For business inquiries:</p>
          <a href="mailto:gerbergpt143@gmail.com" className="text-sm gradient-text font-semibold">gerbergpt143@gmail.com</a>
        </div>
      </div>
      <div className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground space-y-1">
        <div>© {new Date().getFullYear()} GerberGPT. Built with passion for the future of AI.</div>
        <div>Created by <span className="gradient-text font-semibold">Krishna Chaitanya Kolluri</span></div>
      </div>
    </footer>
  );
}
