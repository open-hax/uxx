export function getPromptText(body) {
    if (!body)
        return 'Enter input';
    if (typeof body === 'string')
        return body;
    return body.prompt || 'Enter input';
}
//# sourceMappingURL=PermissionPrompts.types.js.map