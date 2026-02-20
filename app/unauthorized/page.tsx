export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="glass-panel p-10 max-w-lg rounded-3xl shadow-xl border-red-500/20 bg-red-500/5 dark:bg-red-500/10 flex flex-col items-center">
        <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
          ⚠️
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4">
          Access Denied
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
          You do not have the required administrator privileges to view this portal.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-1"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
