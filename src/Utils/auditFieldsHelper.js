export function applyAuditMiddleware(schema) {
    schema.pre('save', function (next) {
        const now = new Date();

        const user = typeof this._user === 'object' && this._user !== null
            ? {
                number: this._user.number || null,
                id: this._user.id || null,
            }
            : { number: null, id: null };

        if (this.isNew) {
            this.AuditFields = {
                createdBy: user,
                updatedBy: user,
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
