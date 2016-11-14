from sqlalchemy import *
from migrate import *


from migrate.changeset import schema
pre_meta = MetaData()
post_meta = MetaData()
actiontype = Table('actiontype', post_meta,
    Column('id', Integer, primary_key=True, nullable=False),
    Column('type', String(length=10)),
    Column('name', String(length=25)),
    Column('cmd', String(length=1)),
)

triggertype = Table('triggertype', post_meta,
    Column('id', Integer, primary_key=True, nullable=False),
    Column('type', String(length=10)),
    Column('name', String(length=25)),
    Column('cmd', String(length=1)),
)


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    post_meta.tables['actiontype'].columns['cmd'].create()
    post_meta.tables['triggertype'].columns['cmd'].create()


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    post_meta.tables['actiontype'].columns['cmd'].drop()
    post_meta.tables['triggertype'].columns['cmd'].drop()
