import * as duckdb from '@duckdb/duckdb-wasm';

const runDuckDB = async () => {
  const LOCAL_REPOS_URL = 'http://localhost:8080/local_repos';
  const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    coi: {
        mainModule: `${LOCAL_REPOS_URL}/duckdb-wasm/duckdb-coi.wasm`,
        mainWorker: `${LOCAL_REPOS_URL}/duckdb-wasm/duckdb-browser-coi.worker.js`,
        pthreadWorker: `${LOCAL_REPOS_URL}/duckdb-wasm/duckdb-browser-coi.pthread.worker.js`,
    },
    eh: {
        mainModule: `${LOCAL_REPOS_URL}/duckdb-wasm/duckdb-eh.wasm`,
        mainWorker: `${LOCAL_REPOS_URL}/duckdb-wasm/duckdb-browser-eh.worker.js`,
    },
    mvp: {
        mainModule: `${LOCAL_REPOS_URL}/duckdb-wasm/duckdb-mvp.wasm`,
        mainWorker: `${LOCAL_REPOS_URL}/duckdb-wasm/duckdb-browser-mvp.worker.js`,
    },
  };

  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  console.log(bundle.mainModule);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
  );

  // Instantiate the asynchronous version of DuckDB-wasm
  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  console.log('DuckDB initialized successfully');
  document.getElementById('status')!.innerText = 'DuckDB initialized successfully!';

  try {
    const conn = await db.connect();
    await conn.query("SET threads=1;");
    const threads = await conn.query("SELECT current_setting('threads') AS threads;");
    const threads_value = threads.get(0)!.toJSON()['threads'];
    console.log('threads:', threads_value);

    const start = performance.now();
    const result = await conn.query("SELECT 1 AS value;");
    const value = result.get(0)!.toJSON()['value'];
    const elapsed = performance.now() - start;
    console.log('Query result:', value);

    document.getElementById('query-result')!.innerText = `Query Result: ${value}`;
    document.getElementById('elapsed')!.innerText = `Elapsed Time: ${elapsed}ms`;
  } catch (queryError) {
    console.error('Error executing query:', queryError);
    document.getElementById('query-result')!.innerText = 'Error executing query';
  }
};

runDuckDB().catch((error) => {
  console.error('Error initializing DuckDB:', error);
  document.getElementById('status')!.innerText = 'Failed to initialize DuckDB';
});
