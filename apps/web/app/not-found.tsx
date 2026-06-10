import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <>
      {/* Ensure external fonts & icons load on this specific page */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}} />

      <div className="bg-gray-50 flex flex-col items-center justify-center min-h-screen font-['Inter']">
        {/* Mobile PWA Canvas */}
        <div className="w-full max-w-[448px] bg-[#F8FAFC] text-[#1b1b1d] flex flex-col min-h-screen sm:shadow-xl sm:border border-black/10 relative overflow-x-hidden">
          
          {/* TopAppBar */}
          <header className="sticky top-0 w-full z-50 flex items-center justify-between px-4 min-h-[44px] bg-[#FFFFFF] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f0edef] flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-[#000000]" data-icon="sports_basketball">sports_basketball</span>
              </div>
              <h1 className="text-[18px] font-bold leading-[24px] text-[#1b1b1d]">AllStars Academy</h1>
            </div>
          </header>

          {/* Main Content Canvas */}
          <main className="flex-1 w-full px-4 py-12 flex flex-col items-center justify-center text-center">
            
            {/* 404 Illustration Area */}
            <div className="relative mb-8 w-full flex flex-col items-center group">
              <div className="relative w-48 h-48 md:w-64 md:h-64 mb-6">
                <div className="absolute inset-0 bg-[#d0e1fb]/40 rounded-full animate-pulse blur-xl scale-110"></div>
                <img 
                  alt="Page not found visual" 
                  className="w-full h-full object-cover rounded-2xl shadow-md border-4 border-[#FFFFFF] relative z-10" 
                  src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop" 
                />
                {/* Floating Icon Overlay */}
                <div className="absolute -bottom-4 -right-4 bg-[#ba1a1a] text-[#ffffff] w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-[#FFFFFF] z-20 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[32px]" data-icon="error_outline">error_outline</span>
                </div>
              </div>

              <h2 className="text-[20px] font-bold leading-[28px] text-[#1b1b1d] mb-2 hover:animate-pulse">Oops! Page not found.</h2>
              <p className="text-[16px] font-normal leading-[24px] text-[#45464d] max-w-[320px] mx-auto">
                The link you followed may be broken or the page may have been removed.
              </p>
            </div>

            {/* Action Section */}
            <div className="w-full space-y-3 mt-4">
              <Link href="/login" className="w-full h-[44px] bg-[#000000] text-[#ffffff] rounded-xl text-[14px] font-medium leading-[20px] shadow-md active:scale-[0.98] transition-all flex items-center justify-center hover:opacity-90">
                Back to Login
              </Link>
              <a href="mailto:support@academy.com" className="w-full h-[44px] bg-[#FFFFFF] text-[#000000] border border-black/10 rounded-xl text-[14px] font-medium leading-[20px] active:scale-[0.98] transition-all flex items-center justify-center hover:bg-gray-50 shadow-sm">
                Contact Us
              </a>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
