// Für Forum: Posts laden und hinzufügen (unverändert)
function loadPosts() {
    fetch('/api/posts')
        .then(res => res.json())
        .then(posts => {
            const container = document.getElementById('posts-container');
            container.innerHTML = '';
            posts.forEach(post => {
                const div = document.createElement('div');
                div.classList.add('post');
                div.innerHTML = `<strong>${post.user}:</strong> ${post.content}`;
                container.appendChild(div);
            });
        });
}

document.getElementById('post-btn').addEventListener('click', () => {
    const user = document.getElementById('post-user').value || 'Anonym';
    const content = document.getElementById('post-content').value.trim();
    if (content) {
        fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, content })
        }).then(() => {
            loadPosts();
            document.getElementById('post-content').value = '';
        });
    }
});

// Posts beim Laden laden
loadPosts();

// Neu: Uploads laden (auf index.html)
if (document.getElementById('uploads-container')) {
    function loadUploads() {
        fetch('/api/uploads')
            .then(res => res.json())
            .then(uploads => {
                const container = document.getElementById('uploads-container');
                container.innerHTML = '';
                uploads.forEach(upload => {
                    const div = document.createElement('div');
                    div.classList.add('upload');
                    div.innerHTML = `<p>${upload.description}</p>`;
                    upload.files.forEach(file => {
                        if (file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.avi')) {
                            div.innerHTML += `<video width="320" controls><source src="${file}" type="video/mp4"></video>`;
                        } else {
                            div.innerHTML += `<img src="${file}" alt="Upload" style="max-width: 300px;">`;
                        }
                    });
                    container.appendChild(div);
                });
            });
    }
    loadUploads();
}