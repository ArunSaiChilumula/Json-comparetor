const UploadPanel = ({
  uploadedFiles,
  loading,
  error,
  setUploadedFiles,
  setAppData,
  setLoading,
  setUploadError,
  defaultData,
}) => {
  const handleFiles = (event) => {
    const selectedFiles = Array.from(event.target.files || []).slice(0, 1);
    if (!selectedFiles.length) {
      return;
    }

    setUploadError("");
    setLoading(true);

    const readJson = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result);
            if (!parsed || typeof parsed !== "object" || !parsed.comparison || !parsed.comparison.differences || !parsed.comparison.combined_analysis) {
              reject(file.name);
              return;
            }
            resolve({ name: file.name, content: parsed });
          } catch (err) {
            reject(file.name);
          }
        };

        reader.onerror = () => reject(file.name);
        reader.readAsText(file);
      });

    Promise.all(selectedFiles.map(readJson))
      .then((files) => {
        setUploadedFiles(files);
        setAppData(files[0].content);
        setLoading(false);
        event.target.value = null;
      })
      .catch((fileName) => {
        setUploadError(fileName ? `Invalid JSON file: ${fileName}` : "Invalid JSON file");
        setLoading(false);
        setUploadedFiles([]);
        setAppData(defaultData);
        event.target.value = null;
      });
  };

  return (
    <div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-sky-400/80">File upload</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Upload your comparison JSON</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Upload a single JSON file containing comparison data, differences, and combined analysis.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition duration-200 hover:-translate-y-0.5">
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={handleFiles}
          />
          Choose File
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 text-sm text-slate-300">
          {loading && (
            <div className="flex items-center gap-2 text-sky-300">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-400" />
              <span>Parsing JSON...</span>
            </div>
          )}
          {error && <p className="text-rose-400">{error}</p>}
          {!loading && !error && uploadedFiles.length === 0 && (
            <p className="text-slate-500">No file uploaded yet. Start by choosing your JSON file.</p>
          )}
        </div>
        {uploadedFiles.length > 0 && (
          <div className="rounded-3xl border border-slate-800/90 bg-slate-950/80 p-3 text-sm text-slate-200">
            <p className="font-semibold text-slate-100">Uploaded file</p>
            <p>{uploadedFiles[0].name}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPanel;
