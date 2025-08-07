import React from "react";
import {
  Sparkles
}";
} from "lucide-react";
import {
  LucideIcon
}";
} from "lucide-react";

interface DashboardHeaderProps {
  ;
  title: string;
  subtitle: string;
  actions?: {
    icon: LucideIcon;
    label: string;
    onClick: () => void
}
}}
}[]}
export default function DashboardHeader({
  title, subtitle, actions = []
}
}: DashboardHeaderProps) {
  ;";
  return ( <div className="flex items-center justify-between mb-8"> <div> <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent mb-2 brand-logo">;
          {title
}";
} </h1> <p className="text-gray-300 text-lg brand-tagline">{
  subtitle
}";
}</p> </div> <div className="flex items-center gap-3"> <span className="inline-flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-4 py-2 rounded-xl font-semibold text-sm shadow"> <Sparkles className="w-4 h-4 mr-2" />;
          AI Powered </span>;
        {
  actions.map((action, index) => ( <button;
}
            key={index}
}
            onClick={action.onClick}
}";
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hove,r:to-cyan-700 text-white px-4 py-2 rounded-xl font-semibold shadow flex items-center "><action.icon className="h-4 w-4 mr-2" />;
            {
  action.label
}";
} </button>)) </div> </div>);