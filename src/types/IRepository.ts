interface IRepository {
    name: string;
    path: string;
    active: boolean;
    /** Branch to measure. Defaults to "main" when omitted. */
    branch?: string;
}

export default IRepository;
