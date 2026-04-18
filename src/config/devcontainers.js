export const devcontainerOptions = [
    {
        id: 'base-ubuntu',
        label: 'Base Ubuntu',
        image: 'mcr.microsoft.com/devcontainers/base:ubuntu',
        description: 'Generic Ubuntu-based dev container with minimal assumptions.',
    },
    {
        id: 'javascript-node',
        label: 'JavaScript/Node.js',
        image: 'mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm',
        description: 'Node-focused container for JavaScript and TypeScript work.',
    },
    {
        id: 'python',
        label: 'Python',
        image: 'mcr.microsoft.com/devcontainers/python:1-3.12-bookworm',
        description: 'Python-focused container with a common baseline.',
    },
]
