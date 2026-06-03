import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}} />

      <div className="bg-gray-50 flex flex-col items-center justify-center min-h-screen font-['Inter']">
        <div className="w-full max-w-[448px] bg-[#F8FAFC] text-[#1b1b1d] flex flex-col min-h-screen sm:shadow-xl sm:border border-black/10 relative overflow-x-hidden">
          
          <header className="sticky top-0 w-full z-50 flex items-center justify-between px-4 min-h-[44px] bg-[#FFFFFF] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f0edef] flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-[#000000]" data-icon="sports_basketball">sports_basketball</span>
              </div>
              <h1 className="text-[18px] font-bold leading-[24px] text-[#1b1b1d]">AllStars Academy</h1>
            </div>
          </header>

          <main className="flex-1 w-full px-4 py-12 flex flex-col items-center justify-center text-center">
            <div className="relative mb-8 w-full flex flex-col items-center group">
              <div className="relative w-48 h-48 md:w-64 md:h-64 mb-6 flex items-center justify-center">
                <span className="material-symbols-outlined text-[120px] text-[#ba1a1a]">lock</span>
              </div>

              <h2 className="text-[20px] font-bold leading-[28px] text-[#1b1b1d] mb-2">Not Authorized</h2>
              <p className="text-[16px] font-normal leading-[24px] text-[#45464d] max-w-[320px] mx-auto">
                You do not have permission to access this page.
              </p>
            </div>

            <div className="w-full space-y-3 mt-4">
              <Link href="/" className="w-full h-[44px] bg-[#000000] text-[#ffffff] rounded-xl text-[14px] font-medium leading-[20px] shadow-md active:scale-[0.98] transition-all flex items-center justify-center hover:opacity-90">
                Go to Dashboard
              </Link>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}