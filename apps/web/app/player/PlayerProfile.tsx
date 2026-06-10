import { updateProfile } from './action';

export function PlayerProfile({ userDetails, playerDetails }: { userDetails: any; playerDetails?: any }) {
  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-slate-900">Profile Details</h2>
        {playerDetails && (
          <p className="text-sm text-slate-500">
            Linked Player: {playerDetails.first_name} {playerDetails.last_name}
          </p>
        )}
      </div>
      <form action={updateProfile} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-900">First Name</label>
          <input
            name="firstName"
            type="text"
            defaultValue={userDetails?.first_name}
            required
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-900">Last Name</label>
          <input
            name="lastName"
            type="text"
            defaultValue={userDetails?.last_name}
            required
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-900">Mobile Number</label>
          <input
            name="mobileNumber"
            type="tel"
            defaultValue={userDetails?.mobile_number || ''}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
        <button type="submit" className="w-full h-12 bg-slate-900 text-white rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm">
          Save Changes
        </button>
      </form>
    </section>
  );
}