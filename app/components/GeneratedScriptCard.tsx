"use client";

import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  Link,
  MessageSquare,
  Copy,
  Download,
  Share2,
} from "lucide-react";

const toolbarItems = [
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: Underline, label: "Underline" },
  { icon: List, label: "Bullet List" },
  { icon: ListOrdered, label: "Numbered List" },
  { icon: AlignLeft, label: "Align" },
  { icon: Link, label: "Link" },
  { icon: MessageSquare, label: "Comment" },
];

const scriptContent = `HOOK (0:00 - 0:15)
AI is changing everything. In this video, I'll show you 5 AI tools that will 10x your productivity in 2024.

INTRO (0:15 - 0:45)
What's up, guys? Welcome back to the channel! If you're new here, I talk about AI, tech, and how to actually use these tools to make your life easier.

TOOL #1 - CHATGPT (0:45 - 2:30)
You already know ChatGPT, but you're probably not using it to its full potential. Let me show you some advanced prompting techniques that most people miss. First, always provide context. Instead of asking "write a blog post," try "write a 1,000-word blog post about AI productivity tools for freelancers, targeting beginners."

TOOL #2 - CLAUDE (2:30 - 4:15)
Claude is my secret weapon for long-form content. It has a massive context window and understands nuanced instructions better than most tools. I use it for script outlines, research synthesis, and even coding assistance.

TOOL #3 - MIDJOURNEY (4:15 - 5:45)
For visuals, Midjourney V6 is absolutely insane. The level of photorealism and artistic control you get now is mind-blowing. I'll drop my favorite prompt structure in the description.

TOOL #4 - ELEVENLABS (5:45 - 6:30)
Voice cloning and text-to-speech has reached a point where it's almost indistinguishable from human speech. Perfect for voiceovers, podcasts, and multilingual content.

TOOL #5 - NOTION AI (6:30 - 7:15)
Notion AI ties everything together. Summarize meeting notes, generate action items, draft emails — all inside your workspace. It's the glue that keeps my entire workflow connected.

OUTRO (7:15 - 7:30)
If you found this helpful, hit that like button and subscribe for more AI breakdowns every week. Let me know in the comments which tool you're most excited to try!`;

export function GeneratedScriptCard() {
  return (
      <div className="flex flex-col h-full bg-[#11151b] border border-white/[0.07] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-white">Generated Script</h3>
        <div className="flex items-center gap-1">
          {toolbarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                title={item.label}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/[0.06] transition-all duration-150 cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 px-5 overflow-y-auto">
        <div className="text-sm text-white/90 leading-[1.8] whitespace-pre-wrap font-normal pb-4">
          {scriptContent.split("\n").map((line, i) => {
            const isSection = line.match(/^[A-Z][A-Z\s#\-0-9:]+\(.*\)$/);
            return (
              <p
                key={i}
                className={`${
                  isSection
                    ? "text-white font-semibold text-xs uppercase tracking-wide mt-5 mb-1"
                    : "text-white/80"
                }`}
              >
                {line}
              </p>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-4 text-[11px] text-[#8B8FA3]">
          <span>1,250 words</span>
          <span className="w-1 h-1 rounded-full bg-white/[0.15]" />
          <span>7 min 30 sec</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/[0.06] transition-all duration-150 cursor-pointer">
            <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/[0.06] transition-all duration-150 cursor-pointer">
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/[0.06] transition-all duration-150 cursor-pointer">
            <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
