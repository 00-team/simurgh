function check_email(email: string): boolean {
    const [id, domain] = email.split('@')
    if (!id || !domain) return false

    let ddi = domain.indexOf('.')
    if (ddi == -1 || ddi == domain.length - 1 || !ddi) return false

    return true
}

export { check_email }
