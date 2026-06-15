
export const Footer = () => {
  return (
    <footer className="py-12 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Info */}
          <div className="space-y-4">
            <div className="text-2xl font-black tracking-tighter">
              Biz<span className="text-primary-green">Sawa</span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              AI-powered business management for African entrepreneurs. 
              Track, Coach, Post, Borrow. All from your counter.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">Product</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#features" className="hover:text-primary-green transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary-green transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary-green transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary-green transition-colors">Careers</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">Legal</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#" className="hover:text-primary-green transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary-green transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">Connect</h4>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary-green/10 hover:text-primary-green transition-all">
                Github
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
          <p>© 2026 BizSawa. All rights reserved. Sawa means exactly right.</p>
          <p>Made with ❤️ for entrepreneurs in East Africa.</p>
        </div>
      </div>
    </footer>
  );
};
