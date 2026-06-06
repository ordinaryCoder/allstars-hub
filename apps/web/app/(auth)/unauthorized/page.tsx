import Link from 'next/link';

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams?.email;

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
            {/* Error Visual */}
            <div className="relative mb-8 group">
              <div className="absolute inset-0 bg-[#ffdad6]/30 blur-2xl rounded-full scale-125"></div>
              <div className="relative w-40 h-40 rounded-full bg-[#FFFFFF] shadow-md flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ba1a1a] leading-none animate-pulse hover:animate-none hover:scale-110 hover:-rotate-12 transition-transform duration-300" style={{ fontSize: '100px' }} data-icon="lock_person">lock_person</span>
              </div>
            </div>

            {/* Error Text */}
            <h2 className="text-[20px] font-bold leading-[28px] text-[#1b1b1d] mb-2">Unauthorized Page</h2>
            <p className="text-[16px] font-normal leading-[24px] text-[#45464d] mb-10 leading-relaxed px-4">
              {email ? (
                <>The account <span className="font-semibold text-black">{email}</span> does not have permission to view this page. </>
              ) : (
                'You do not have permission to view this page. '
              )}
              Please contact your administrator if you believe this is an error.
            </p>

            {/* Dynamic Action Card */}
            <div className="w-full mb-8">
              <a href="mailto:support@academy.com" className="w-full h-[44px] bg-[#000000] text-[#ffffff] rounded-xl text-[14px] font-medium leading-[20px] shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:opacity-90">
                <span className="material-symbols-outlined" data-icon="mail">mail</span>
                Contact Us
              </a>
            </div>

            {/* Primary Action */}
            <Link href="/login" className="w-full h-[44px] bg-[#000000] text-[#ffffff] rounded-xl text-[14px] font-medium leading-[20px] shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:opacity-90">
              <span className="material-symbols-outlined" data-icon="login">login</span>
              Go to Login Page
            </Link>
          </main>
        </div>
      </div>
    </>
  );
}
