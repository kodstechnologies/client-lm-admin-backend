export function applyAuditMiddleware(schema) {
    schema.pre('save', function (next) {
        const now = new Date();

        const user = typeof this._user === 'object' && this._user !== null
            ? {
                name: this._user.name || 'system',
                id: this._user.id || null,
            }
            : { name: 'system', id: null };

        if (this.isNew) {
            this.AuditFields = {
                createdBy: user,
                updatedBy: null,
            };
        } else {
            this.AuditFields = {
                ...(this.AuditFields || {}),
                updatedBy: user,
                updatedAt: now,
            };
        }

        next();
    });

    schema.methods.setUser = function (user) {
        this._user = user;
    };
}
