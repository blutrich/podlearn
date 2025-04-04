import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Headphones, Sparkles, ArrowRight, Brain, Clock, Zap, Check, Coins, Infinity, Users, Gift, Award } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuth = () => {
    console.log("Navigating to auth...", { currentPath: location.pathname });
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">Pod Class</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <Link to="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
              Browse
            </Link>
            <Link to="/referrals" className="text-muted-foreground hover:text-foreground transition-colors">
              Referrals
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="hidden md:inline-flex"
              onClick={handleAuth}
            >
              Log in
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={handleAuth}
            >
              Get Started
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
                AI-POWERED LEARNING
              </motion.span>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Turn Podcasts into <span className="text-gradient">Structured Lessons</span>
              </motion.h1>
              <motion.p 
                className="text-lg text-muted-foreground max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Transform your podcast listening into active learning. Our AI analyzes episodes, creates structured lessons, and helps you retain knowledge effectively.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                  onClick={() => navigate("/browse")}
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-accent"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView()}
                >
                  How it Works
                </Button>
              </motion.div>
            </div>
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="relative bg-card rounded-2xl overflow-hidden shadow-2xl border border-border">
                <div className="aspect-[2/1] rounded-lg overflow-hidden bg-gradient-to-b from-background to-accent">
                  <img 
                    src="/app-preview.png" 
                    alt="Pod Class Interface"
                    className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-300"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-accent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How Pod Class Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your podcast listening into structured learning
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Headphones,
                title: "Choose a Podcast",
                description: "Select from our curated collection of educational podcasts or add your own favorites."
              },
              {
                icon: Sparkles,
                title: "AI Processing",
                description: "Our AI transcribes the episode and generates a structured lesson with key takeaways."
              },
              {
                icon: Brain,
                title: "Learn & Retain",
                description: "Study the organized content, take notes, and track your learning progress."
              }
            ].map((step, i) => (
              <motion.div 
                key={i}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * i }}
              >
                <div className="bg-background rounded-xl p-6 h-full border border-border hover:border-primary/50 transition-all duration-300">
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Smart Learning Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to learn effectively from podcasts
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "AI Transcription",
                description: "Accurate, speaker-separated transcripts for every episode"
              },
              {
                title: "Smart Summaries",
                description: "Key points and takeaways automatically extracted"
              },
              {
                title: "Learning Paths",
                description: "Curated episode sequences for structured learning"
              },
              {
                title: "Progress Tracking",
                description: "Monitor your learning journey across episodes"
              },
              {
                title: "Note Taking",
                description: "Add personal notes and highlights to lessons"
              },
              {
                title: "Mobile Friendly",
                description: "Learn on any device, anywhere, anytime"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-accent/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start with 2 free episodes. Then choose what works best for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="relative bg-background border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">Free Trial</span>
              </div>
              <div className="text-3xl font-bold mb-2">$0</div>
              <div className="text-sm text-muted-foreground mb-6">
                Try before you buy
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>2 free episode credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Full lesson generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Basic features</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleAuth}
              >
                Get Started
              </Button>
            </div>

            {/* Pay As You Go */}
            <div className="relative bg-background border-2 border-primary rounded-xl p-6 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Coins className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">Pay As You Go</span>
              </div>
              <div className="text-3xl font-bold mb-2">$2.00</div>
              <div className="text-sm text-muted-foreground mb-6">
                per episode credit
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Buy credits in packs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Credits never expire</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Bulk discounts available</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>All premium features</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-primary hover:bg-primary/90" 
                onClick={() => navigate("/pricing")}
              >
                Buy Credits
              </Button>
            </div>

            {/* Unlimited */}
            <div className="relative bg-background border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Infinity className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">Unlimited</span>
              </div>
              <div className="text-3xl font-bold mb-2">$9</div>
              <div className="text-sm text-muted-foreground mb-6">
                per month
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Unlimited episodes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>All premium features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/pricing")}
              >
                Subscribe
              </Button>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">All plans include:</p>
            <div className="flex flex-wrap justify-center gap-8 max-w-3xl mx-auto">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>AI-powered transcription</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Smart lesson generation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Progress tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Note-taking tools</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Refer Friends, Earn Rewards</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Share PodClass with your friends and earn free credits when they join. The more you share, the more you earn!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 border border-border flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Invite Friends</h3>
              <p className="text-muted-foreground mb-4">
                Share your unique referral link with friends who love podcasts and learning.
              </p>
              <Link to="/referrals" className="mt-auto">
                <Button variant="outline" size="sm">
                  Get Your Link
                </Button>
              </Link>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-border flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Credits</h3>
              <p className="text-muted-foreground mb-4">
                Receive 1 free credit for each friend who signs up using your referral link.
              </p>
              <div className="mt-auto">
                <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                  1 Credit = 1 Episode
                </span>
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-border flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bonus Rewards</h3>
              <p className="text-muted-foreground mb-4">
                Refer 5 friends and get a special bonus reward. The more you share, the more you earn!
              </p>
              <Link to="/referrals" className="mt-auto">
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              size="lg" 
              onClick={handleAuth}
              className="bg-primary hover:bg-primary/90"
            >
              Start Referring Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-accent">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Learn Smarter?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join Pod Class today and transform your podcast listening into an active learning experience.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            onClick={handleAuth}
          >
            Get Started for Free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Pod Class</span>
            </Link>
            <div className="flex flex-wrap justify-center gap-8">
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How it Works
              </a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <Link to="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
                Browse
              </Link>
              <Link to="/referrals" className="text-muted-foreground hover:text-foreground transition-colors">
                Referrals
              </Link>
              <Button 
                variant="link" 
                className="text-muted-foreground hover:text-foreground p-0 h-auto"
                onClick={handleAuth}
              >
                Sign Up
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Pod Class. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
