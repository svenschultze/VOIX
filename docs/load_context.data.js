import fs from 'node:fs'
export default {
    watch: ['./tools.md', './context.md', './getting-started.md', './core-concepts.md', './vision.md', './vue-integration.md', './react-integration.md', './svelte-integration.md'],
    load(watchedFiles) {
        // Return an object with keys as file names without './' and '.md', values as file contents
        const result = {};
        watchedFiles.forEach((file) => {
            const key = file.replace(/^\.\/|\.md$/g, '');
            result[key] = fs.readFileSync(file, 'utf-8');
        });
        return result;
    }
}
