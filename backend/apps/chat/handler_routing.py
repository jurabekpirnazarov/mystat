from .handlers import (
    AboutMeHandler,
    AuthorizationHandler,
    ChatCreateHandler,
    ChatDeleteHandler,
    CreateClientSessionHandler,
    MessageDeleteHandler,
    MessageEditHandler,
    MessageSeeHandler,
    MessageSendHandler,
)

handlers = {
    "session__create": CreateClientSessionHandler,
    "session__authorize": AuthorizationHandler,
    "chat__create": ChatCreateHandler,
    "message__create": MessageSendHandler,
    "message__see": MessageSeeHandler,
    "message__edit": MessageEditHandler,
    "message__delete": MessageDeleteHandler,
    "chat__delete": ChatDeleteHandler,
    "about_me": AboutMeHandler,
}
