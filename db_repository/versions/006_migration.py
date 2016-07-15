from sqlalchemy import *
from migrate import *


from migrate.changeset import schema
pre_meta = MetaData()
post_meta = MetaData()
controller_triggers = Table('controller_triggers', post_meta,
    Column('controller_id', Integer),
    Column('trigger_id', Integer),
    Column('input', Integer),
)

trigger = Table('trigger', post_meta,
    Column('id', Integer, primary_key=True, nullable=False),
    Column('controller_id', Integer),
    Column('triggertype_id', Integer),
    Column('num', Integer),
    Column('name', String(length=24)),
    Column('param1', String(length=8)),
    Column('param2', String(length=8)),
)


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    post_meta.tables['controller_triggers'].create()
    post_meta.tables['trigger'].columns['num'].create()


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pre_meta.bind = migrate_engine
    post_meta.bind = migrate_engine
    post_meta.tables['controller_triggers'].drop()
    post_meta.tables['trigger'].columns['num'].drop()
