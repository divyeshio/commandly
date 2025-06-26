export default defineNitroConfig({
    vercel: {
        config: {
            routes: [{
                src: "/tools",
                handle: "filesystem"
            }]
        }
    }
})