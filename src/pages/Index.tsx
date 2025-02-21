
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-secondary/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg"></div>
            <span className="text-xl font-semibold">Podcastly</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/70 hover:text-white transition-colors">
              Features
            </a>
            <a href="#browse" className="text-white/70 hover:text-white transition-colors">
              Browse
            </a>
            <a href="#pricing" className="text-white/70 hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="hidden md:inline-flex hover:text-white hover:bg-white/10"
              onClick={() => navigate("/auth")}
            >
              Log in
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => navigate("/auth")}
            >
              Sign up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <motion.span 
                className="inline-block text-primary font-mono text-sm px-3 py-1 rounded-full bg-primary/10 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                LEARN FROM PODCASTS
              </motion.span>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Learn from your favorite podcasts
              </motion.h1>
              <motion.p 
                className="text-lg text-white/70 max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Transform podcast episodes into structured learning experiences with AI-powered transcription and lesson generation.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white px-8"
                  onClick={() => navigate("/browse")}
                >
                  Browse podcasts
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white/20 hover:bg-white/10"
                >
                  Learn more
                </Button>
              </motion.div>
            </div>
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
              <motion.div 
                className="relative bg-card rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <img 
                  src="/placeholder.svg" 
                  alt="App Preview" 
                  className="w-full h-auto"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Podcasts Section */}
      <section className="py-20 px-4 bg-accent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Podcasts</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Discover our curated selection of educational podcasts
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i}
                className="group bg-card rounded-xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * i }}
              >
                <div className="aspect-video bg-muted">
                  <img 
                    src="/placeholder.svg" 
                    alt="Podcast thumbnail" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Podcast Title</h3>
                  <p className="text-white/70 mb-4">
                    Brief description of the podcast and its content.
                  </p>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center border border-white/10 hover:bg-primary hover:text-white"
                  >
                    Learn more
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
