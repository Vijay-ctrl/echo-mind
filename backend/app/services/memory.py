class ConversationMemory:

    def __init__(self):
        self.conversations = {}

    def get_previous_id(self, chat_id: str):
        return self.conversations.get(chat_id)

    def update(
        self,
        chat_id: str,
        interaction_id: str,
    ):
        self.conversations[chat_id] = interaction_id

    def clear(self, chat_id: str):
        self.conversations.pop(
            chat_id,
            None,
        )

    def clear_all(self):
        self.conversations.clear()