"""New user-style AVL source; no algorithm identifiers enter the interpreter."""
BODY = r"""
#include <stdlib.h>
#include <stdio.h>
struct Node {int key;int height;struct Node *left;struct Node *right;};
int height(struct Node *n){return n?n->height:0;}
void refresh(struct Node *n){int a=height(n->left);int b=height(n->right);n->height=1+(a>b?a:b);}
struct Node *rotateRight(struct Node *n){struct Node *top=n->left;struct Node *middle=top->right;top->right=n;n->left=middle;refresh(n);refresh(top);return top;}
struct Node *rotateLeft(struct Node *n){struct Node *top=n->right;struct Node *middle=top->left;top->left=n;n->right=middle;refresh(n);refresh(top);return top;}
struct Node *insert(struct Node *n,int key){
 if(!n){struct Node *fresh=calloc(1,sizeof(*fresh));fresh->key=key;fresh->height=1;return fresh;}
 if(key<n->key)n->left=insert(n->left,key);else if(key>n->key)n->right=insert(n->right,key);else return n;
 refresh(n);int balance=height(n->left)-height(n->right);
 if(balance>1){if(key>n->left->key)n->left=rotateLeft(n->left);return rotateRight(n);}
 if(balance<-1){if(key<n->right->key)n->right=rotateRight(n->right);return rotateLeft(n);}
 return n;
}
void ordered(struct Node *n){if(!n)return;ordered(n->left);printf("%d ",n->key);ordered(n->right);}
"""
def program(keys):
 return BODY+'\nint main(){struct Node *root=0;int keys[]={'+','.join(map(str,keys))+'};for(int cursor=0;cursor<'+str(len(keys))+';cursor++)root=insert(root,keys[cursor]);ordered(root);}'
