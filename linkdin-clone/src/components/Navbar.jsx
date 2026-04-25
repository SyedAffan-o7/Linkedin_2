import { useState } from "react";
import { Home, Users, Briefcase, MessageSquare, Bell, Search, ChevronDown, Grid3X3, User } from "lucide-react";

function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { name: 'Home', icon: Home, active: true },
    { name: 'My Network', icon: Users, badge: 3 },
    { name: 'Jobs', icon: Briefcase },
    { name: 'Messaging', icon: MessageSquare, badge: 5 },
    { name: 'Notifications', icon: Bell, badge: 12 },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left - Logo and Search */}
        <div className="flex items-center gap-4">
          <div className="bg-[#0a66c2] rounded px-1.5 py-0.5 flex items-center">
            <span className="text-white font-bold text-3xl">in</span>
          </div>
          <div className="hidden md:flex items-center bg-gray-100 rounded-md px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-transparent outline-none text-sm w-48"
            />
          </div>
        </div>

        {/* Right - Nav Items */}
        <div className="flex items-center gap-1 md:gap-6">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
                item.active ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs hidden md:block">{item.name}</span>
            </button>
          ))}

          {/* Me Dropdown */}
          <div className="relative border-l border-gray-200 pl-4 ml-2">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
            >
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-xs text-gray-500 hidden md:block">Me</span>
                <ChevronDown className="w-3 h-3 text-gray-500 hidden md:block" />
              </div>
            </button>

            <div className={`absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-200 ${dropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Demo User</p>
                    <p className="text-sm text-gray-500">Full Stack Developer</p>
                  </div>
                </div>
                <button className="mt-3 w-full border-2 border-blue-600 text-blue-600 font-semibold py-1 rounded-full hover:bg-blue-50 transition-colors">
                  View Profile
                </button>
              </div>
              <div className="p-2">
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">Settings & Privacy</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">Help</a>
                <hr className="my-2 border-gray-200"/>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">Sign Out</a>
              </div>
            </div>
          </div>

          {/* For Business */}
          <button className="hidden lg:flex flex-col items-center gap-0.5 px-2 py-1 hover:bg-gray-100 rounded transition-colors text-gray-500">
            <Grid3X3 className="w-6 h-6" />
            <div className="flex items-center gap-0.5">
              <span className="text-xs">For Business</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
