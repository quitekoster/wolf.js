import type CommandContext from "../interfaces/CommandContext";
import type SDK from "../SDK";

export default (...ids) => (sdk: SDK, context: CommandContext, next: () => Promise<void>): Promise<void> => {
    const { originator } = context.message;

    if (!ids.includes(originator['id'] ?? originator)) return Promise.resolve();
    
    return next();
}